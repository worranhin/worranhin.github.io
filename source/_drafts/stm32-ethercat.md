---
title: stm32-ethercat 主站开发日志
tags: [嵌入式, STM32, EtherCAT]
---

在此姑且用流水账的形式记录一下用 STM32 开发 Ethercat 主站时遇到的重重困难。

## 开发板硬件配置

开发板使用的是 STM32F407ZGT6.

### 网络模块 ETH

买的开发板的使用了 25MHz 的无源晶振作为 LAN8720A 的时钟输入，将 REF_CLK 配置为 Out Mode，即 REF_CLK 引脚为 50MHz 时钟的输出，将该引脚接到 STM32 上的对应引脚上即可同步二者的时钟。

## 电脑网络配置

在调试 LwIP 时使用电脑直接插网线到开发板上，开发板上加载了示例的 tcp_echo_server 程序，也就是开发板作为 tcp 协议的服务器，但是电脑的调试工具一直连不上，感到很奇怪。在不断检查代码然无果后，突然想到改一下电脑网卡的 IP 试试，改了之后果然就可以了。这可能是因为电脑用的是工位的固定 IP 地址，也不知道是不是这个原因。还是要再补充一点计算机网络的知识啊。

> 在这里顺便安利一下在微软应用商店找到的一个网络调试工具，叫做 TCPUDP网络调试助手，界面是用 WinUI3 编写的，非常现代简洁好看，很符合我的 xp

## 应用 FreeRTOS

在成功用电脑 ping 通板子后，开始学习 FreeRTOS 的使用，首先是在 CubeMX 中启动，并且在 SYS 中设置 Timebase, 这里就设为基本定时器 TIM6 吧，接着按照提示在 FreeRTOS 的 Advanced Settings 选项将 USE_NEWLIB_REENTRANT 设为 Enable, 
因为这个应用应该比较简单，所以暂时就将 Memory Management scheme 设置为 `heap_1`, 即内存一旦分配就不再解除的模式。然后看了看芯片数据手册，是支持 FPU 的，所以把 `ENABLE_FPU` 也设置上。那差不多就可以保存一下，生成代码了。

> 在生成代码后记得改一下 ethernetif.c, 因为开发板用的不是 lan8742 而是 lan8720

在用 FreeRTOS 时遇到一个问题，程序会停在这个地方：

```c
/* Look up the interrupt's priority. */
ucCurrentPriority = pcInterruptPriorityRegisters[ ulCurrentInterrupt ];

/* The following assertion will fail if a service routine (ISR) for
an interrupt that has been assigned a priority above
configMAX_SYSCALL_INTERRUPT_PRIORITY calls an ISR safe FreeRTOS API
function.  ISR safe FreeRTOS API functions must *only* be called
from interrupts that have been assigned a priority at or below
configMAX_SYSCALL_INTERRUPT_PRIORITY.

Numerically low interrupt priority numbers represent logically high
interrupt priorities, therefore the priority of the interrupt must
be set to a value equal to or numerically *higher* than
configMAX_SYSCALL_INTERRUPT_PRIORITY.

Interrupts that	use the FreeRTOS API must not be left at their
default priority of	zero as that is the highest possible priority,
which is guaranteed to be above configMAX_SYSCALL_INTERRUPT_PRIORITY,
and	therefore also guaranteed to be invalid.

FreeRTOS maintains separate thread and ISR API functions to ensure
interrupt entry is as fast and simple as possible.

The following links provide detailed information:
http://www.freertos.org/RTOS-Cortex-M3-M4.html
http://www.freertos.org/FAQHelp.html */
configASSERT( ucCurrentPriority >= ucMaxSysCallPriority );
```

按它的说法，就是系统中断的优先级不能设得比 configMAX_SYSCALL_INTERRUPT_PRIORITY 高（数值更低），
那让我试试把它改小吧。

好了，这个问题解决了，但是总是跳到 `Hard_Fault_Handler()` 。

于是上网找了找官方的LwIP示例，找了一通发现原来是 FreeRTOS 的 defaultThread
也就是 LwIP 的线程给的 Stack size 太小了，默认只有 128，但是官方给的是 512 * 4，差的也太多了。

仔细看了看 LwIP 模块有个配置项叫 `DEFAULT_THREAD_STACKSIZE`, 默认为 1024，可能是要比这个大吧。

姑且先改为 2048 吧，这样系统就正常运行了。

### TCP/UDP with RTOS 测试

接着试一试示例里 TCPUDP with RTOS 的代码吧，直接把 tcpecho 的代码 copy 进来，在 main 中的 StartDefaultThread 里面初始化，
然后在电脑上发一个消息，结果是成功地返回了。

然后再试试 UDP, 同样地，把代码 copy 进来再做一些小修改，结果就跑不动了。

经过一番调试，最后是定位到这个 ASSERT 中：

```c 
/* A function that implements a task must not exit or attempt to return to
its caller as there is nothing to return to.  If a task wants to exit it
should instead call vTaskDelete( NULL ).

Artificially force an assert() to be triggered if configASSERT() is
defined, then stop here so application writers can catch the error. */
configASSERT( uxCriticalNesting == ~0UL );
```

他说线程中不应该有返回，但是我也没有返回啊，于是去问问 Kimi, 他给我翻译了一遍，然后说可能是栈空间不足，可以尝试增加任务的栈大小。
欸，貌似似曾相识的问题。于是去到 FreeRTOS 的配置中，增大了 `TOTAL_HEAP_SIZE`, 然后就可以了...... 还真是这个问题啊。
看来以后遇到奇怪的错误还是优先检查一下分配的栈空间够不够吧（或者直接一步到位分到最大值，但隐约感觉这样不太好）

> 顺带一提，现在的 `TOTAL_HEAP_SIZE` 是 20480 Bytes(20KB), 之前的话是 15360 Bytes(15KB), 也就差了 5KB 嘛 (ﾟ∀。), 
> 这样一看还是增到原来的两倍得了，也就是 30720 Bytes, 反正最大支持 128KB 呢 ( ` ・´)

嗯......现在还有个奇怪的问题，就是复位之后如果在短时间内给板子发信息，就会出错，程序就不跑了（用定时器写了个LED 1s 闪烁的程序，但是 LED 也不闪了）。
但是如果过一定时间再发，好像就没有这个问题，很奇怪，难道要在某个地方加个延时吗？

## SOEM 移植

接下来就是 SOEM 的移植工作了，看到一个挺不错的[文章](https://blog.csdn.net/pengrunxin/article/details/127202794)，甚至也是控制汇川的，先参考参考。
[这篇帖子](https://club.rt-thread.org/ask/article/59c34adc09b75123.html)是用 RT-Thread 实现主站控制汇川电机，但没有开放源码，也能稍作参考。

移植列表 (osal.c)  

- [ ] void osal_timer_start(osal_timert * self, uint32 timeout_us);
- [ ] boolean osal_timer_is_expired(osal_timert * self);
- [ ] int osal_usleep(uint32 usec);
- [x] ec_timet osal_current_time(void);
- [ ] void osal_time_diff(ec_timet *start, ec_timet *end, ec_timet *diff);
- [ ] int osal_thread_create(void *thandle, int stacksize, void *func, void *param);
- [ ] int osal_thread_create_rt(void *thandle, int stacksize, void *func, void *param);