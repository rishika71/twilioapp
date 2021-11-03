import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';
import { Link } from 'react-router-dom';

export class Login extends Component {
    static displayName = Login.name;

    render() {
        return (
            <div>
                <h1>Login</h1>
                <Form>
                    <FormGroup>
                        <Label for="email">Email</Label>
                        <Input type="email" name="email" id="email" placeholder="Email" onChange={this.props.onChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="password">Password</Label>
                        <Input type="password" name="password" id="password" placeholder="Password" onChange={this.props.onChange}/>
                    </FormGroup>
                    <Link to="/home">
                        <Button onClick={this.props.onClick}>Login</Button>
                    </Link>
                </Form>
            </div>
        );
    }
}