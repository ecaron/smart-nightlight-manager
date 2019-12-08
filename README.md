# Internet-enabled children's nightlight
Powered by Node.JS and a variety of types of internet-controllable lights, such as:
* [Philips Hue](https://www2.meethue.com/en-us/)
* [NeoPixel & ESP8266](https://github.com/jasoncoon/esp8266-fastled-webserver)

## Why Does This Exist?
I wanted my kids to have a nightlight in their room that:

* Had programmable color
* Had an adjustable timer (turns off X minutes after being turned on)
* Had an interface to show history of button pushes (so I can see when they were awake)
* Schedule the light to change color on a schedule (so at 7am it turns to blue to indicate "Ok, it's morning time!")

## Live Demos
| Demo of button turning light on  |
| -------------------------------- |
| ![light turn on](https://cloud.githubusercontent.com/assets/70704/12696100/d261de2c-c726-11e5-9022-74036dab6a3a.gif) |

| Demo of button turning light off |
| -------------------------------- |
| ![light turn off](https://cloud.githubusercontent.com/assets/70704/12696097/d25e4ab4-c726-11e5-91a0-861b13149c83.gif) |


## What Does This Do?
There is a Node.js web server that runs on the network, connects to the Philips Hue bridge, and listens on the network for some button to get pushed.

Each button gets associated with a light on the network. If the button is pushed and the light is off - the light is turned on (and a timer is started to automatically turn the light off after X minutes). If the button is pushed and the light is on - the light is turned off.

There is also a web application that sets the default color and colors during specific time periods. The web interface - in addition to showing times of button pushes - permits turning the light on with & without the timer, and turning the light off.

## Setup
### Getting The App Running
For the most part, it is a straight-forward Node.js application. After downloading this repo and extracting it to a directory of your choice, run:

* `npm install`
* `npm start`

You can now access http://localhost:3000/ and view the complete interface. (On my home network, I put this behind nginx and set the in-house DNS to know it as "nightlight". So now babysitters and family just go to http://nightlight/ to use it.)


### Keeping The App Running
You'll find plenty of other great tutorials on the web about running a Node.js app as a daemon, but here are a couple:

* http://howtonode.org/deploying-node-upstart-monit
* https://serversforhackers.com/video/process-monitoring-with-supervisord

## Screenshots
| Desktop interface for monitor and control |
| ----------------------------------------- |
| <img src="https://cloud.githubusercontent.com/assets/70704/12696098/d260035e-c726-11e5-8297-27ffc765358d.png" width="100%"> |

| Mobile interface for monitor and control |
| ---------------------------------------- |
| ![mobile view](https://cloud.githubusercontent.com/assets/70704/12696099/d26159b6-c726-11e5-8952-de1e04d173e4.png) |


## Acknowledgements
* [Original blog about hacking the Dash button](https://medium.com/p/794214b0bdd8)
* [jscolor Color Picker](http://jscolor.com/) - Makes selecting colors really easy
* [Bootswatch](https://bootswatch.com/) - Great source for Bootstrap themes
* [Nunjucks](https://mozilla.github.io/nunjucks/) - Really great templating language for JavaScript
* [jQuery Timepicker](https://github.com/jonthornton/jquery-timepicker) - Fast way to add time handling to the interface
* [node-dash-button](https://github.com/hortinstein/node-dash-button) - Fantastic module to find Node button on the network, and bind it to events. No longer used, but inspiring.
* [node-hue-api](https://github.com/peter-murray/node-hue-api) - Wonderful module to find and control Philips Hue bridges and bulbs
