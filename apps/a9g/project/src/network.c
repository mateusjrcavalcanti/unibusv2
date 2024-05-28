

#include <string.h>
#include <stdio.h>
#include <api_os.h>
#include <api_event.h>
#include <api_network.h>
#include <api_debug.h>

#include "network.h"

HANDLE NetworkTaskHandle = NULL;
HANDLE semGetCellInfo = NULL;

bool AttachActivate()
{
    uint8_t status;
    bool attachmentStatus = Network_GetAttachStatus(&status);
    // Anexar à rede
    if (!attachmentStatus)
    {
        Trace(2, "ERRO AO OBTER STATUS DE ANEXO");
        return false;
    }
    else
        Trace(2, "[NETWORK] STATUS DE ANEXO A REDE:%d", status);

    if (!status)
    {
        attachmentStatus = Network_StartAttach();
        if (!attachmentStatus)
        {
            Trace(2, "[NETWORK] ERROR AO ANEXAR A REDE");
            return false;
        }
    }
    else
    {
        // Ativar a rede
        attachmentStatus = Network_GetActiveStatus(&status);
        if (!attachmentStatus)
        {
            Trace(2, "[NETWORK] ERROR AO OBTER STATUS DE ATIVACAO");
            return false;
        }
        else
            Trace(2, "[NETWORK] STATUS DE ATIVACAO:%d", status);
        if (!status)
        {
            Network_PDP_Context_t context = {
                .apn = PDP_CONTEXT_APN,
                .userName = PDP_CONTEXT_USERNAME,
                .userPasswd = PDP_CONTEXT_PASSWD};
            status = Network_StartActive(context);
            if (status == NETWORK_STATUS_ACTIVATE_FAILED)
            {
                Trace(2, "[NETWORK] ERROR AO ATIVAR A REDE");
                return false;
            }
        }
    }
    return true;
}

void NetworkEventDispatch(API_Event_t *pEvent)
{
    switch (pEvent->id)
    {
    case API_EVENT_ID_NETWORK_REGISTER_SEARCHING:
        Trace(2, "API_EVENT_ID_NETWORK_REGISTER_SEARCHING");
        break;
    case API_EVENT_ID_NETWORK_DEREGISTER:
        Trace(2, "API_EVENT_ID_NETWORK_DEREGISTER");
        break;
    case API_EVENT_ID_NETWORK_CELL_INFO:
    {
        // param1: cell number (1 serving cell and param1-1 neighbor cells), pParam1: Network_Location_t[param1]
        int cellCount = pEvent->param1;
        Network_Location_t *cellInfoList = (Network_Location_t *)pEvent->pParam1;
        Trace(2, "API_EVENT_ID_NETWORK_CELL_INFO, cell number: %d", cellCount);
        for (int i = 0; i < cellCount; i++)
        {
            Trace(2, "Cell %d: MCC: %d%d%d, MNC: %d%d%d, LAC: %d, CellID: %d, BSIC: %d, RxLev: %d, RxLevSub: %d, ARFCN: %d",
                  i,
                  cellInfoList[i].sMcc[0], cellInfoList[i].sMcc[1], cellInfoList[i].sMcc[2],
                  cellInfoList[i].sMnc[0], cellInfoList[i].sMnc[1], cellInfoList[i].sMnc[2],
                  cellInfoList[i].sLac, cellInfoList[i].sCellID,
                  cellInfoList[i].iBsic, cellInfoList[i].iRxLev,
                  cellInfoList[i].iRxLevSub, cellInfoList[i].nArfcn);
        }
        break;
    }
    case API_EVENT_ID_NETWORK_AVAILABEL_OPERATOR:
    {
        // param1: operator number, pParam1: operator info list (Network_Operator_Info_t[param1])
        int operatorCount = pEvent->param1;
        Network_Operator_Info_t *operatorList = (Network_Operator_Info_t *)pEvent->pParam1;
        Trace(2, "API_EVENT_ID_NETWORK_AVAILABEL_OPERATOR, operator number: %d", operatorCount);
        for (int i = 0; i < operatorCount; i++)
        {
            char statusStr[20];
            switch (operatorList[i].status)
            {
            case 0:
                strcpy(statusStr, "unknown");
                break;
            case 1:
                strcpy(statusStr, "available");
                break;
            case 2:
                strcpy(statusStr, "current");
                break;
            case 3:
                strcpy(statusStr, "disabled");
                break;
            default:
                strcpy(statusStr, "unknown");
                break;
            }

            Trace(2, "Operator %d, ID: %s, Status: %s, PS Flag: %s",
                  i, operatorList[i].operatorId, statusStr, operatorList[i].hasPSFlag ? "Yes" : "No");
        }
        break;
    }
    case API_EVENT_ID_NETWORK_REGISTER_DENIED:
        Trace(2, "API_EVENT_ID_NETWORK_REGISTER_DENIED");
        break;
    case API_EVENT_ID_NETWORK_REGISTER_NO:
        Trace(2, "API_EVENT_ID_NETWORK_REGISTER_NO");
        break;
    case API_EVENT_ID_NETWORK_REGISTERED_HOME:
        Trace(2, "API_EVENT_ID_NETWORK_REGISTERED_HOME");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_REGISTERED_ROAMING:
        Trace(2, "API_EVENT_ID_NETWORK_REGISTERED_ROAMING");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_DETACHED:
        Trace(2, "API_EVENT_ID_NETWORK_DETACHED");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_ATTACH_FAILED:
        Trace(2, "API_EVENT_ID_NETWORK_ATTACH_FAILED");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_ATTACHED:
        Trace(2, "API_EVENT_ID_NETWORK_ATTACHED");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_DEACTIVED:
        Trace(2, "API_EVENT_ID_NETWORK_DEACTIVED");
        AttachActivate();
    case API_EVENT_ID_NETWORK_ACTIVATE_FAILED:
        Trace(2, "API_EVENT_ID_NETWORK_ACTIVATE_FAILED");
        AttachActivate();
        break;
    case API_EVENT_ID_NETWORK_ACTIVATED:
        Trace(2, "API_EVENT_ID_NETWORK_ACTIVATED");
        break;
    case API_EVENT_ID_SIGNAL_QUALITY:
        Trace(2, "API_EVENT_ID_SIGNAL_QUALITY: [%d] SQ(0~31,99(unknown)), [%d] RXQUAL(0~7,99(unknown)) [%d] (RSSI = SQ*2-113)", pEvent->param1, pEvent->param2, pEvent->param1 * 2 - 113);
        break;
    case API_EVENT_ID_NETWORK_GOT_TIME:
    {
        RTC_Time_t *time = (RTC_Time_t *)pEvent->pParam1;
        if (time)
        {
            Trace(2, "API_EVENT_ID_NETWORK_GOT_TIME [RECEIVED]: %02d:%02d:%02d", time->hour, time->minute, time->second);
        }
        else
        {
            Trace(2, "API_EVENT_ID_NETWORK_GOT_TIME [NULL]");
        }
        break;
    }

    default:
        break;
    }
}

void NetworkTestTask(void *param)
{
    uint8_t operatorId[6];
    Network_Register_Mode_t mode;
    bool ret;

    while (1)
    {

        OS_Sleep(5000); // Atraso de 5 segundos
    }
}
