#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <PubSubClient.h>
#include <WiFi.h>

class MQTTClientManager {
public:
    static void setup(void (*commandCallback)(char*, byte*, unsigned int));
    static void loop();
    static bool isConnected();
    static bool publishTelemetry(const char* jsonPayload);
    static bool publishStatusOnline();
    static bool publishACK(const char* commandId, bool success, bool state);
private:
    static void reconnect();
};

#endif // MQTT_CLIENT_H
