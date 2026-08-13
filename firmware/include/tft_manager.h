#ifndef TFT_MANAGER_H
#define TFT_MANAGER_H

#include <TFT_eSPI.h>
#include "sensor_manager.h"

class TFTManager {
public:
    static void setup();
    static void renderDashboard(const SensorData& data, bool actuatorState, bool wifiConnected, bool mqttConnected);
    static void showMessage(const char* title, const char* msg);
};

#endif // TFT_MANAGER_H
