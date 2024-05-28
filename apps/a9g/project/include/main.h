// main.h
#ifndef __MAIN_H_
#define __MAIN_H_

#include "api_os.h"

#define MAIN_TASK_STACK_SIZE (2048 * 2)
#define MAIN_TASK_PRIORITY 0
#define MAIN_TASK_NAME "Main Task"

extern HANDLE mainTaskHandle;

#endif
