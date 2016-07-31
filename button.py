import os
import requests
##
#
# I've found this script useful for attaching a Raspberry Pi to a button
# and then having the button turn the light on/off
#
##

import signal
import time
import RPi.GPIO as GPIO

# I like to have CntlC be handled gracefully
def signal_handler(signal, frame):
    os._exit(1)
signal.signal(signal.SIGINT, signal_handler)

url = 'http://nightlight/' # I map this to my internal DNS hosting the node app
gpio_pin=18 # The GPIO pin the button is attached to
longpress_threshold=5 # If button is held this length of time, tells system to leave light on

GPIO.setmode(GPIO.BCM)
GPIO.setup(gpio_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

while True:
    time.sleep(0.2)

    if GPIO.input(gpio_pin) == False: # Listen for the press, the loop until it steps
        print "Started press"
        pressed_time=time.time()
        while GPIO.input(gpio_pin) == False:
            time.sleep(0.2)

        pressed_time=time.time()-pressed_time
        print "Button pressed %d, POSTing to nightlight server" % pressed_time
        if pressed_time<longpress_threshold:
            data = dict(light=2, cmd="toggle-with-timer")
        else:
            data = dict(light=2, cmd="toggle-keep-on")

        r = requests.post(url, data=data, allow_redirects=True)
        print r.content


