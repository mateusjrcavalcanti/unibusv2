// Include SDK libraries
#include <string.h>
#include <stdio.h>
#include <api_os.h>
#include <api_event.h>
#include <api_debug.h>
#include "api_lbs.h" //-> get location(longitude and latitude) from server though base station(BS) information
#include "buffer.h"
#include "gps_parse.h"
#include "gps.h"
#include "api_info.h"
#include "api_socket.h"

// Include the project libraries
#include "pgps.h"
#include "network.h"
#include "mqtt.h"

// Define the network task event
HANDLE gpsTaskHandle = NULL;

// Define shared variables

// Define local variables
uint8_t buffer[1024], buffer2[400];

float latitudeLbs = 0.0;
float longitudeLbs = 0.0;

/* ===[ Define network functions here ]=== */
void GPSEventDispatch(API_Event_t *pEvent)
{
    static uint8_t lbsCount = 0;
    switch (pEvent->id)
    {
    case API_EVENT_ID_GPS_UART_RECEIVED:
        // Trace(1,"received GPS data,length:%d, data:%s,flag:%d",pEvent->param1,pEvent->pParam1,flag);
        GPS_Update(pEvent->pParam1, pEvent->param1);
        break;
    default:
        break;
    }
}

void gpsTask(void *pData)
{
    GPS_Info_t *gpsInfo = Gps_GetInfo();
    uint8_t buffer[300];

    // wait for gprs register complete
    // The process of GPRS registration network may cause the power supply voltage of GPS to drop,
    // which resulting in GPS restart.
    while (!hasNetwork)
    {
        Trace(1, "[GPS] Waiting for network registration");
        OS_Sleep(2000);
    }

    // open GPS hardware(UART2 open either)
    GPS_Init();
    GPS_Open(NULL);

    // wait for gps start up, or gps will not response command
    while (gpsInfo->rmc.latitude.value == 0)
        OS_Sleep(1000);

    // set gps nmea output interval
    for (uint8_t i = 0; i < 5; ++i)
    {
        bool ret = GPS_SetOutputInterval(10000);
        Trace(1, "[GPS] SET NMEA OUTPUT INTERVAL %s", ret ? "SUCCESS" : "FAIL");
        if (ret)
            break;
        OS_Sleep(1000);
    }

    // if(!GPS_ClearInfoInFlash())
    //     Trace(1,"erase gps fail");

    // if(!GPS_SetQzssOutput(false))
    //     Trace(1,"enable qzss nmea output fail");

    // if(!GPS_SetSearchMode(true,false,true,false))
    //     Trace(1,"set search mode fail");

    // if(!GPS_SetSBASEnable(true))
    //     Trace(1,"enable sbas fail");

    if (!GPS_GetVersion(buffer, 150))
        Trace(1, "[GPS] GET FIRMWARE VERSION FAIL");
    else
        Trace(1, "[GPS] FIRMWARE VERSION:%s", buffer);

    // if(!GPS_SetFixMode(GPS_FIX_MODE_LOW_SPEED))
    // Trace(1,"set fix mode fail");

    if (!GPS_SetOutputInterval(1000))
        Trace(1, "[GPS] SET NMEA OUTPUT INTERVAL TO 1 SECOND FAIL");

    Trace(1, "init ok");

    while (1)
    {
        if (hasNetwork)
        {
            // show fix info
            uint8_t isFixed = gpsInfo->gsa[0].fix_type > gpsInfo->gsa[1].fix_type ? gpsInfo->gsa[0].fix_type : gpsInfo->gsa[1].fix_type;
            char *isFixedStr;
            if (isFixed == 2)
                isFixedStr = "2D fix";
            else if (isFixed == 3)
            {
                if (gpsInfo->gga.fix_quality == 1)
                    isFixedStr = "3D fix";
                else if (gpsInfo->gga.fix_quality == 2)
                    isFixedStr = "3D/DGPS fix";
            }
            else
                isFixedStr = "no fix";

            // convert unit ddmm.mmmm to degree(°)
            int temp = (int)(gpsInfo->rmc.latitude.value / gpsInfo->rmc.latitude.scale / 100);
            double latitude = temp + (double)(gpsInfo->rmc.latitude.value - temp * gpsInfo->rmc.latitude.scale * 100) / gpsInfo->rmc.latitude.scale / 60.0;
            temp = (int)(gpsInfo->rmc.longitude.value / gpsInfo->rmc.longitude.scale / 100);
            double longitude = temp + (double)(gpsInfo->rmc.longitude.value - temp * gpsInfo->rmc.longitude.scale * 100) / gpsInfo->rmc.longitude.scale / 60.0;

            // you can copy ` latitude,longitude ` to http://www.gpsspg.com/maps.htm check location on map

            snprintf(buffer, sizeof(buffer), "GPS fix mode:%d, BDS fix mode:%d, fix quality:%d, satellites tracked:%d, gps sates total:%d, is fixed:%s, coordinate:WGS84, Latitude:%f, Longitude:%f, unit:degree,altitude:%f", gpsInfo->gsa[0].fix_type, gpsInfo->gsa[1].fix_type,
                     gpsInfo->gga.fix_quality, gpsInfo->gga.satellites_tracked, gpsInfo->gsv[0].total_sats, isFixedStr, latitude, longitude, gpsInfo->gga.altitude);
            // show in tracer
            Trace(2, buffer);

            // send the coordinates string to MQTT
            if (mqttStatus == MQTT_STATUS_CONNECTED)
            {
                snprintf(buffer, sizeof(buffer), "%f,%f", latitude, longitude);
                mqttPublish(client, buffer);
            }
        }

        OS_Sleep(1000);
    }
}
