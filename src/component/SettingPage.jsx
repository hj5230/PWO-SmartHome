/* eslint-disable no-unused-vars */
import React from "react";
import {
  Figure,
  Form,
  InputGroup,
  Navbar,
  Container,
  Card,
  Badge
} from "react-bootstrap";
import on from '../on.png'
import off from "../off.png"

export default class SettingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      heating: false,
      saved: false
    }
  }

  componentDidMount() {
    this.timer = null;
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleSwitch = (e) => {
    const { name, checked } = e.target;
    this.setState({
      [name]: checked,
    });
  }

  handleSave = () => {
    this.setState({
      saved: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        saved: false,
      });
    }, 3000);
  }

  render() {
    const { heating, saved } = this.state
    return (
      <>
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href='/'>
              SmartHome
            </Navbar.Brand>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-wifi" viewBox="0 0 16 16">
              <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z"/>
              <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.473 6.473 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.478 5.478 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091l.016-.015zM9.06 12.44c.196-.196.198-.52-.04-.66A1.99 1.99 0 0 0 8 11.5a1.99 1.99 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z"/>
            </svg>
          </Container>
        </Navbar>
        <div className="saver">
          {saved ? (
            <Badge >SETTING APPLIED</Badge>
          ) : (
            <></>
          )}
        </div>
        <div className="switch">
        <Card>
          <div className="container">
            {heating ? (
              <Figure.Image width={350} src={on} className='img' />
            ) : (
              <Figure.Image width={350} src={off} className='img' />
            )}
          </div>
          <Card.Body>
            <Form.Check 
            type="switch"
            label="HEAT"
            id="heating"
            name="heating"
            checked={heating}
            onChange={this.handleSwitch}
            />
            <br />
            {heating ? (
              <>
              <InputGroup size="sm">
                <Form.Control placeholder="temperature" onBlur={this.handleSave} />
                <Form.Control placeholder="humidity" onBlur={this.handleSave} />
              </InputGroup>
              <br />
              <Form.Label>Wind Speed</Form.Label>
              <Form.Range onChange={this.handleSave} />
              </>
            ) : (
              <>
              <InputGroup size="sm">
                <Form.Control placeholder="temperature" disabled />
                <Form.Control placeholder="humidity" disabled/>
              </InputGroup>
              <br />
              <Form.Label>Wind Speed</Form.Label>
              <Form.Range disabled />
              </>
            )}
          </Card.Body>
        </Card>
        </div>
      </>
    )
  }
}
  
