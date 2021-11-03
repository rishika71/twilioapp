import React, { Component } from 'react';
import { Redirect, Route } from 'react-router';
import { Layout } from './components/Layout';
import { LoginContainer } from './containers/LoginContainer';
import { UsersContainer } from './containers/UsersContainer';
import { withCookies } from 'react-cookie';
import { Home } from './components/Home';

import './custom.css'

class App extends Component {
    static displayName = App.name;

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            token: this.props.cookies.get('token'),
        }

        this.setUser = this.setUser.bind(this);
    }

  setUser(user, token) {
    if(token === null){
        this.props.cookies.remove('token')
    }
    else{
        this.props.cookies.set('token', token, { path: '/' })
    }
      this.setState({
         user: user
      })
  }

  render () {
    let token = this.props.cookies.get('token')

      return (
          <Layout user={this.state.user} setUser={this.setUser} cookies={this.props.cookies}>
              {token !== undefined ? <Redirect to="/home"/> : <Route path='/login' render={(props) => <LoginContainer setUser={this.setUser}/>} />}
              <Route path='/home' render={(props) => <Home user={this.state.user} cookies={this.props.cookies}/>}/>
              {token === undefined ? <Redirect to="/login"/> : <Route path='/home' render={(props) => <UsersContainer user={this.state.user} cookies={this.props.cookies}/>} />}
          </Layout>
      );
  }
}

export default withCookies(App);
