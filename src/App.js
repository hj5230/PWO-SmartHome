import './App.css';
import React from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import FrontPage from './component/FrontPage';
import SettingPage from './component/SettingPage';

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      paired: false
    }
  }
  willPaired = () => {
    this.setState({
      paired: true
    })
  }
 
  render() {
    return (
      <>
      {this.state.paired ? (
        <SettingPage />
      ) : (
        <FrontPage willPaired={this.willPaired} />
      ) }
      </>
    );
  }
}

export default App;
