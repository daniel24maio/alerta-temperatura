#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <DHT.h>
#include <vector>
#include <String.h>

struct SensorData {
    float temperature;
    float humidity;
    int noiseLevel;
    String alertCode;
    String lcdMessage;
    bool requiresActuator;
};

class SensorManager {
public:
    static void setup();
    static SensorData readSensors();
};

#endif // SENSOR_MANAGER_H
