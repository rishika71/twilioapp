import React, { Component } from 'react';
import { Login } from '../components/Login';


export class LoginContainer extends Component {
    static displayName = LoginContainer.name;

    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false,
            email: "",
            password: ""
        };

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.checkUser = this.checkUser.bind(this);

    }

    handleChange(event) {
        const value = event.target;

        if (value.name === "email") {
            this.setState({
                email: value.value,
            })
        }
        else if (value.name === "password") {
            this.setState({
                password: value.value,
            })
        }
    }

    async checkUser() {

        const requestOptions = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                email: this.state.email,
                pass: this.state.password
            })
        };

        const response = await fetch('/admin/login', requestOptions);

        const data = await response.text();

        const json = JSON.parse(data);

        console.log(json)
        if (!json.hasOwnProperty('error')) {
            this.props.setUser(data, json.token);
            this.setState({ user: data, loggedIn: true });
        } else {
            alert("Error - " + json.message);
        }

    }

    handleClick(event) {
        event.preventDefault();

        this.checkUser().then();
    }

  
    render() {
      
        return (
            <div>
                {this.state.loggedIn === true ? false : <Login onClick={this.handleClick} onChange={this.handleChange} />}
            </div>
        );
    }
}
