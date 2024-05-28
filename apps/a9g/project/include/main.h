#ifndef __MAIN_H_
#define __MAIN_H_

// Include the API header file
#include "api_os.h"

// Define the main task parameters
#define MAIN_TASK_STACK_SIZE (2048 * 2)
#define MAIN_TASK_PRIORITY 0
#define MAIN_TASK_NAME "Main Task"

// Define the main task event
extern HANDLE mainTaskHandle;

#endif
