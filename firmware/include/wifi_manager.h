#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>

class WiFiManager {
public:
    static void setup();
    static void loop();
    static bool isConnected();
};

#endif // WIFI_MANAGER_H
