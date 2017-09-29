import React from 'react';
import { StyleSheet, Text, TextInput, Button, Alert, View } from 'react-native';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }        
  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{height: 40}}
          placeholder="Type here to translate!"
          keyboardType="numbers-and-punctuation"
          onChangeText={(text) => this.setState({text})}
        />
        <Button
          onPress={() => {Alert.alert('You tapped the button!')}}
          title="Press Me"
        />
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
