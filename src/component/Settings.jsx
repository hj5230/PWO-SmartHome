/* eslint-disable no-unused-vars */
import React from "react";
import {
  Badge,
  Navbar,
  Container,
  Card,
  Form,
  InputGroup,
} from "react-bootstrap";

export default class Sesstings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      outside: null, // outside temp fetched from api
      expect: null, // current temp inside
      length: null, // dimensions of the house
      width: null,
      height: null,
      wiA: null, // window area
      desired: null, // desired temp
      time: null, // time rquired to heat up
    };
  }

  componentDidMount = async () => {
    this.setState({ // restore house diameters from localstorage
      length: localStorage.getItem("length"),
      width: localStorage.getItem("width"),
      height: localStorage.getItem("height"),
      wiA: localStorage.getItem("wiA"),
    });
    // fetch and process current outdoor temp from api
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const datetime = `${year}-${month}-${day}T${hour}:00`;
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=60.17&longitude=24.94&hourly=temperature_2m";
    const response = await fetch(url);
    const data = await response.json();
    const index = data.hourly.time.indexOf(datetime);
    const temp = data.hourly.temperature_2m[index];
    this.setState({
      outside: temp,
    });
  };

  // reset localstorage items when house diameters change
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
    localStorage.setItem(name, value);
  };

  // calculate temp losses, also minimul power retain indoor temp
  heatLoss = (length, width, height, windowSize, outsideTemp, insideTemp) => {
    // checks if all of the required parameters have been passed
    if (!(length && width && height && windowSize && outsideTemp && insideTemp))
      return "-";
    const U_wall = 0.4;
    const U_roof = 0.25;
    const U_window = 1.4;
    const perimeter = (length + width) * 2;
    const A_wall = perimeter * height;
    const A_roof = length * width;
    const A_window = windowSize;
    const deltaT = insideTemp - outsideTemp;
    const Q_wall = U_wall * A_wall * deltaT;
    const Q_roof = U_roof * A_roof * deltaT;
    const Q_window = U_window * A_window * deltaT;
    const Q_total = Q_wall + Q_roof + Q_window;
    return parseFloat(Q_total.toFixed(1));
  };

  // calculate minimum power required to heat up within desinated time
  heatUp = (
    length,
    width,
    height,
    windowSize,
    outsideTemp,
    insideTemp,
    targetTemp,
    timeInMinutes
  ) => {
    if (
      !(
        length &&
        width &&
        height &&
        windowSize &&
        outsideTemp &&
        insideTemp &&
        targetTemp &&
        timeInMinutes
      )
    )
      return "-";
    const maintainingPower = this.heatLoss(
      length,
      width,
      height,
      windowSize,
      outsideTemp,
      insideTemp
    );
    const volume = length * width * height;
    const density = 1.225; // kg/m³
    const specificHeatCapacity = 1.006; // kJ/(kg·K)
    const mass = volume * density;
    const deltaT = targetTemp - insideTemp;
    // Convert specific heat capacity to J/(kg·K)
    const specificHeatCapacityJ = specificHeatCapacity * 1000;
    const energyRequired = mass * specificHeatCapacityJ * deltaT; // in Joules
    const timeInSeconds = timeInMinutes * 60;
    const powerRequired = energyRequired / timeInSeconds; // in Watts
    const totalPowerRequired = powerRequired + maintainingPower;
    return parseFloat(totalPowerRequired.toFixed(1));
  };

  render() {
    const { outside, expect, length, width, height, wiA, desired, time } =
      this.state;
    const watt = this.heatLoss(
      parseFloat(length),
      parseFloat(width),
      parseFloat(height),
      parseFloat(wiA),
      parseFloat(outside),
      parseFloat(expect)
    );
    const power = this.heatUp(
      parseFloat(length),
      parseFloat(width),
      parseFloat(height),
      parseFloat(wiA),
      parseFloat(outside),
      parseFloat(expect),
      parseFloat(desired),
      parseFloat(time)
    );
    const energy = parseFloat(((power * time * 60) / 1000).toFixed(1));
    return (
      <>
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href="/">SmartHome</Navbar.Brand>
          </Container>
        </Navbar>
        <div className="settings-panel">
          <Card>
            <Card.Body>
              <h5>Basic info</h5>
              <Badge bg="secondary" pill>
                Length
              </Badge>
              <Form.Control
                name="length"
                placeholder="m"
                value={length}
                onChange={this.handleChange}
                autoComplete="off"
              />
              <Badge bg="secondary" pill>
                Width
              </Badge>
              <Form.Control
                name="width"
                placeholder="m"
                value={width}
                onChange={this.handleChange}
                autoComplete="off"
              />
              <Badge bg="secondary" pill>
                Height
              </Badge>
              <Form.Control
                name="height"
                placeholder="m"
                value={height}
                onChange={this.handleChange}
                autoComplete="off"
              />
              <Badge bg="secondary" pill>
                Window Size
              </Badge>
              <Form.Control
                name="wiA"
                placeholder="m²"
                value={wiA}
                onChange={this.handleChange}
                autoComplete="off"
              />
              <br />
              <h5>Heat Simulator</h5>
              <small style={{ fontWeight: "bold" }}>
                It's {outside}°C outside.
              </small>
              <br />
              <Form.Control
                name="expect"
                placeholder="Current temperature(°C) inside"
                onChange={this.handleChange}
                autoComplete="off"
              />
              <small style={{ fontWeight: "bold" }}>
                It takes {watt} W to keep house warm.
              </small>
              <br />
              <br />
              <InputGroup>
                <Form.Control
                  name="desired"
                  placeholder="Desired temperature(°C) inside"
                  onChange={this.handleChange}
                  autoComplete="off"
                />
                <Form.Control
                  name="time"
                  placeholder="Desired time"
                  onChange={this.handleChange}
                  autoComplete="off"
                />
              </InputGroup>
              <small style={{ fontWeight: "bold" }}>
                {power} watts are required to heat the room to {desired}°C in{" "}
                {time} minutes.
              </small>
              <br />
              {!isNaN(energy) && (
                <small style={{ fontWeight: "bold" }}>
                  The heating process requires {energy} kWh.
                </small>
              )}
            </Card.Body>
          </Card>
        </div>
      </>
    );
  }
}

// 1.232 KJ/°C/m³
// Uwall = 0.4 W/(m²·K)
// Uroof = 0.25 W/(m²·K)
// Uwindow = 1.4 W/(m²·K)
// length = x
// width = y
// height = z
// wallArea = 2 * (x * z + y * z) - windowArea
// roofArea = 2 * (x * y)
// Temp - temp
