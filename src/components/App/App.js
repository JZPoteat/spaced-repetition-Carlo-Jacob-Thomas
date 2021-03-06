import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import Header from "../Header/Header";
import PrivateRoute from "../PrivateRoute/PrivateRoute";
import PublicOnlyRoute from "../PublicOnlyRoute/PublicOnlyRoute";
import RegistrationRoute from "../../routes/RegistrationRoute/RegistrationRoute";
import LoginRoute from "../../routes/LoginRoute/LoginRoute";
import DashboardRoute from "../../routes/DashboardRoute/DashboardRoute";
import LearningRoute from "../../routes/LearningRoute/LearningRoute";
import NotFoundRoute from "../../routes/NotFoundRoute/NotFoundRoute";
import "./App.css";
import fileContext from "../../contexts/fileContext";
import MultipleChoice from "../../routes/MultipleChoice/MultipleChoice";
import TextToSpeech from "../TextToSpeech/TextToSpeech";
import TokenService from "../../services/token-service";
import LanguageApiService from "../../services/language-service";


export default class App extends Component {
  state = {
    hasError: false,
    language: "",
    words: [],
  };

  static contextType = fileContext;

  static getDerivedStateFromError(error) {
    console.error(error);
    return { hasError: true };
  }

  setLangAndWords = (res) => {
    this.setState({
      language: res.language,
      words: res.words
    })
  };



  render() {

    if (TokenService.hasAuthToken() && this.state.language === "") {
      LanguageApiService.getWords()
      .then((res) => this.state.setLangAndWords(res))
      .catch((error) => this.setState({ error: error }));
    }
    const value = {
      language: this.state.language,
      words: this.state.words,
      setLangAndWords: this.setLangAndWords,

    };
    const { hasError } = this.state;
    return (
      <div className="App">
        <fileContext.Provider value={value}>
          <Header />
          <main>
            {hasError && <p>There was an error! Oh no!</p>}
            <Switch>
              <PrivateRoute exact path={"/"} component={DashboardRoute} />
              <PrivateRoute path={"/learn"} component={LearningRoute} />
              <PrivateRoute exact path={"/learn_mc"} component={MultipleChoice} />
              <PublicOnlyRoute
                path={"/register"}
                component={RegistrationRoute}
              />
              <PublicOnlyRoute path={"/login"} component={LoginRoute} />
              <PublicOnlyRoute path={"/text_speech"} component={TextToSpeech} />
              <Route component={NotFoundRoute} />
            </Switch>
          </main>
        </fileContext.Provider>
      </div>
    );
  }
}
