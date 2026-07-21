
import './App.css';

import AgenticDashboard from './components/Agentic/Dashboard'

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  BrowserRouter,
  Navigate
} from 'react-router-dom';
import React from 'react';



class App extends React.Component {

  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div>
        <BrowserRouter>
          <Routes>
            <Route exact path='/' element={< AgenticDashboard />}></Route>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }
}


export default App;
