import React from 'react';
import { StyleSheet, Text, TextInput, Button, Alert, View, AsyncStorage } from 'react-native';
import Expo from 'expo';
import Store from 'react-native-simple-store';

const SHEET_NAME = 'ミルク';
const REFRESH_TOKEN_KEY = 'google:refreshToken';
const CLIENT_ID_KEY = 'google:clientID';
const SPREADSHEET_ID_KEY = 'spreadsheetId';
const SHEET_NAME_KEY = 'sheetName';

function nullOrEmpty(value) {
  return (value === null || value === '');
}

async function signInWithGoogleAsync(clientId) {
  try {
    const result = await Expo.Google.logInAsync({
      iosClientId: clientId,
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
    this.state = {text: '', clientId: '', spreadSheetId: '', sheetName: '', accessToken: null};
  }

  componentDidMount() {
    this.loadConfigurations();
  }

  render() {
    return (
      <View style={styles.container}>
        <TextInput
          style={{height: 40}}
          placeholder="数値入力"
          keyboardType="numeric"
          onChangeText={(text) => this.setState({text})}
        />
        <Button
          onPress={this.appendRow.bind(this)}
          title="記録する"
        />
        <View style={{marginTop: 30, marginBottom: 30}}>
          <Button
            onPress={this.googleAuth.bind(this)}
            title="Sign in with Google"
          />
        </View>
        <View style={{marginTop: 30}}>
          <TextInput
            style={{height: 40}}
            placeholder="Google API Client ID"
            keyboardType="default"
            value={this.state.clientId}
            onChangeText={(clientId) => this.setState({clientId})}
          />
          <TextInput
            style={{height: 40}}
            placeholder="SpreadSheet ID"
            keyboardType="default"
            value={this.state.spreadsheetId}
            onChangeText={(spreadsheetId) => this.setState({spreadsheetId})}
          />
          <TextInput
            style={{height: 40}}
            placeholder="SheetName"
            keyboardType="default"
            value={this.state.sheetName}
            onChangeText={(sheetName) => this.setState({sheetName})}
          />
          <Button
            onPress={this.saveConfigurations.bind(this)}
            title="Save configs"
          />
        </View>
      </View>
    );
  }

  async saveConfigurations() {
    await Store.save(SPREADSHEET_ID_KEY, this.state.spreadsheetId);
    await Store.save(CLIENT_ID_KEY, this.state.clientId);
    await Store.save(SHEET_NAME_KEY, this.state.sheetName);
    console.log('cofigurations saved');
  }

  async loadConfigurations() {
    const clientId = await Store.get(CLIENT_ID_KEY);
    const spreadsheetId = await Store.get(SPREADSHEET_ID_KEY);
    const accessToken = await this.getAccessToken(clientId);
    const sheetName = await Store.get(SHEET_NAME_KEY);
    console.log('loadConfigurations:')
    console.log(`  clientId: ${clientId}`);
    console.log(`  spreadsheetId: ${spreadsheetId}`);
    console.log(`  sheetName: ${sheetName}`);
    console.log(`  accessToken: ${accessToken}`);
    this.setState({clientId, accessToken, spreadsheetId, sheetName});
  }

  saveRefreshToken(refreshToken) {
    AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async getAccessToken(clientId) {
    try {
      const clientId = await Store.get(CLIENT_ID_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (nullOrEmpty(refreshToken)) {
        return null;
      }
      const params = {
        client_id: clientId,
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
    const clientId = this.state.clientId;
    console.log(`client id: ${this.state.clientId}`)
    if (nullOrEmpty(clientId)) return;
    signInWithGoogleAsync(clientId).then(result => {
      const {accessToken, refreshToken} = result;
      console.log(`result=${result}`);
      console.log(`accessToken=${accessToken}`);
      console.log(`refreshToken=${refreshToken}`);
      this.saveRefreshToken(refreshToken);
      this.setState({accessToken});
    });
  }

  appendRow() {
    const spreadsheetId = this.state.spreadsheetId;
    const sheetName = this.state.sheetName;
    if (nullOrEmpty(spreadsheetId) || nullOrEmpty(sheetName) || this.state.accessToken === null){
      console.log('insufficient configurations');
      return;
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(SHEET_NAME)}:append?valueInputOption=USER_ENTERED`;
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
