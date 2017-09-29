import React from 'react';
import { StyleSheet, Text, TextInput, Button, Alert, View, AsyncStorage } from 'react-native';
import Expo from 'expo';

const CLIENT_ID = 'xxxxx';
const SPREADSHEET_ID = 'yyyyy';
const SHEET_NAME = 'ミルク';
const REFRESH_TOKEN_KEY = 'google:RefreshToken';

async function signInWithGoogleAsync() {
  try {
    const result = await Expo.Google.logInAsync({
      iosClientId: CLIENT_ID,
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/spreadsheets'],
    });

    if (result.type === 'success') {
      return result;
    } else {
      return {cancelled: true};
    }
  } catch(e) {
    return {error: true};
  }
}

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: ''};
  }
  componentDidMount() {
    this.getAccessToken()
    .then((accessToken) => {
      // console.log(`accessToken=${accessToken}`);
      if (accessToken === null)
        this.googleAuth();
      else
        this.setState({accessToken});
    }).catch((error) => {
      console.log(error);
    });
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
          onPress={this.appendRow.bind(this)}
          title="記録する"
        />
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
        <Button
          onPress={this.googleAuth.bind(this)}
          title="Sign in with Google"
        />
      </View>
    );
  }

  saveRefreshToken(refreshToken) {
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async getAccessToken() {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken === null) {
        return null;
      }
      // console.log(`got refreshToken: ${refreshToken}`);
      const params = {
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      };
      var formBody = [];
      for (var property in params) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(params[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      formBody = formBody.join("&");
      const response = await fetch('https://www.googleapis.com/oauth2/v4/token',{
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      });
      const responseJson = await response.json();
      // console.log(responseJson);
      return responseJson.access_token;
    } catch(error) {
      console.error(error);
    }
  }

  googleAuth() {
    signInWithGoogleAsync().then(result => {
      const {accessToken, refreshToken} = result;
      console.log(`result=${result}`);
      console.log(`accessToken=${accessToken}`);
      console.log(`refreshToken=${refreshToken}`);
      this.saveRefreshToken(refreshToken);
      this.setState({accessToken});
    });
  }

  appendRow() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}:append?valueInputOption=USER_ENTERED`;
    const time = new Date();
    var hours = time.getHours();
    if (hours < 10) { hours = '0' + hours; }
    var minutes = time.getMinutes();
    if (minutes < 10) { minutes = '0' + minutes; }
    const dateString = `${time.getFullYear()}/${time.getMonth() + 1}/${time.getDate()} ${hours}:${minutes}`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.state.accessToken}`,
      },
      body: JSON.stringify({
        values: [
          [dateString, this.state.text]
        ],
      })
    })
    .then(response => response.json())
    .then(responseJson => console.log(responseJson))
    .catch(error => console.error(error));
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
