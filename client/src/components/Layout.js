import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

export class Layout extends Component {
  static displayName = Layout.name;

  render () {
    return (
      <div>
        <NavMenu user={this.props.user} setUser={this.props.setUser} cookies={this.props.cookies}/>
        <Container>
          {this.props.children}
        </Container>
      </div>
    );
  }
}
