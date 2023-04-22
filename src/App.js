import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import FrontPage from "./component/FrontPage";
import SettingPage from "./component/SettingPage";
import Sesstings from "./component/Settings";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      paired: false,
    };
  }

  // wait for msg from child component
  willPaired = () => {
    this.setState({
      paired: true,
    });
  };

  // two routes defined
  render() {
    return (
      <>
        <Router>
          <Routes>
            <Route
              path="/"
              exact
              element={
                this.state.paired ? (
                  <SettingPage />
                ) : (
                  <FrontPage willPaired={this.willPaired} />
                )
              }
            ></Route>
            <Route path="/settings" element={<Sesstings />}></Route>
          </Routes>
        </Router>
      </>
    );
  }
}

export default App;
