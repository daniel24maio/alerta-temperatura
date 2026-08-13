#include "actuator_manager.h"
#include "config.h"

static bool currentActuatorState = false;

void ActuatorManager::setup() {
    pinMode(PIN_LED_ALERT, OUTPUT);
    pinMode(PIN_ACTUATOR_RELAY, OUTPUT);
    digitalWrite(PIN_LED_ALERT, LOW);
    digitalWrite(PIN_ACTUATOR_RELAY, LOW);
}

void ActuatorManager::setActuatorState(bool state) {
    currentActuatorState = state;
    digitalWrite(PIN_ACTUATOR_RELAY, state ? HIGH : LOW);
    digitalWrite(PIN_LED_ALERT, state ? HIGH : LOW);
}

bool ActuatorManager::getActuatorState() {
    return currentActuatorState;
}

void ActuatorManager::setAlertLED(bool state) {
    digitalWrite(PIN_LED_ALERT, state ? HIGH : LOW);
}
