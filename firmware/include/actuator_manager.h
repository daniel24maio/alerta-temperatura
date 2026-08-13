#ifndef ACTUATOR_MANAGER_H
#define ACTUATOR_MANAGER_H

class ActuatorManager {
public:
    static void setup();
    static void setActuatorState(bool state);
    static bool getActuatorState();
    static void setAlertLED(bool state);
};

#endif // ACTUATOR_MANAGER_H
