import React from "react";
import fileContext from "../../contexts/fileContext";
import LanguageApiService from "../../services/language-service";
import Results from "../../components/Results/Results";
import "./MultipleChoice.css";
import ISOStore from "../../components/TextToSpeech/ISOStore";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'en-US';
// recognition.lang = 'es-MX';

var msg = new SpeechSynthesisUtterance();
msg.text = "bien y tu como estas";

export default class MultipleChoice extends React.Component {
  static contextType = fileContext;

  constructor(props) {
    super(props);
    this.state = {
      options: [],
      nextWord: null,
      totalScore: null,
      wordIncorrectCount: null,
      wordCorrectCount: null,
      answer: null,
      isCorrect: null,
      guessBool: false,
      loading: true,
      guessTerm: null,
      speechBool: false,
      listening: false,
    };
  }
  componentDidMount() {

    if(this.context.language === "") {
      LanguageApiService.getWords()
      .then((res) => this.context.setLangAndWords(res))
      .catch((error) => this.setState({ error: error }));
    }
    let lang = Object.keys(ISOStore).find(key => ISOStore[key] === this.context.language.name)
    msg.lang = lang;
      LanguageApiService.getHead()
      .then((head) => {
        this.setState({
          nextWord: head.nextWord,
          wordIncorrectCount: head.wordIncorrectCount,
          wordCorrectCount: head.wordCorrectCount,
          totalScore: head.totalScore,
          loading: false,
          guessTerm: ''
        });
      })
      .then(() => {
        this.getOptions();
      })
      .catch((error) => this.setState({ error: error }));
  }

  getOptions() {
    console.log(this.state.nextWord);
    let correctAnswer = this.context.words.find(
      (word) => word.original === this.state.nextWord
    ).translation;
    let options = [correctAnswer];
    while (options.length !== 4) {
      let index = Math.floor(Math.random() * this.context.words.length);
      options.push(this.context.words[index].translation);
      options = [...new Set(options)].sort(() => Math.random() - 0.5);
    }
    this.setState({
      options: options,
    });
  }

  updateGuess = (e) => {
    this.setState({
      guessTerm: e.target.value,
    });
  };

  handleSpeech = () => {
    this.setState({
      guessTerm: '',
      listening: true
    })

    recognition.start();

    recognition.onstart = () => {
      console.log('Voice activated');
    }

    recognition.onresult = (e) => {
      let current = e.resultIndex;

      let transcript = e.results[current][0].transcript;
      let speechBool = this.state.options.includes(transcript.toLowerCase());

      if (speechBool) {
        this.setState({
          guessTerm: transcript.toLowerCase(),
          speechBool: false,
          listening: false
        })
      } else {
        this.setState({
          speechBool: true,
          listening: false
        })
      }
    }
  };

  handleSubmit = () => {
    const guess = this.state.guessTerm;

    const guessBody = {
      guess,
    };

    LanguageApiService.postGuess(guessBody).then((summary) => {
      let newCorrectScore = this.state.wordCorrectCount;
      let newIncorrectScore = this.state.wordIncorrectCount;
      if (summary.isCorrect) {
        newCorrectScore++;
      } else {
        newIncorrectScore++;
      }
      this.setState({
        totalScore: summary.totalScore,
        wordIncorrect: newIncorrectScore,
        wordCorrect: newCorrectScore,
        answer: summary.answer,
        isCorrect: summary.isCorrect,
        guessBool: true,
        speechBool: false,
      });
    })
    .then(() => {
      this.getOptions();
    })
  };

  handleNextWord = (event) => {
    event.preventDefault();
    LanguageApiService.getHead()
      .then((head) => {
        this.setState({
          nextWord: head.nextWord,
          wordIncorrectCount: head.wordIncorrectCount,
          wordCorrectCount: head.wordCorrectCount,
          guessBool: false,
          speechBool: false,
          guessTerm: ''
        });
      })
      .then(() => {
        this.getOptions();
      });
  };

  MultipleChoiceForm = () => {
    return (
      <div className='mc-div-container'>
        {!this.state.guessBool && <div id="speech_to_text_box">
          <button id="speech_button" type="button" onClick={this.handleSpeech} disabled={this.state.listening}>
            <i className="fas fa-microphone"></i>
          </button>
        </div>}
        {this.state.listening && <p>Listening...</p>}

        <div id="mc_options_box">
          {this.state.options.map((option) => {
            if (this.state.guessTerm === option) {
              return (
                <button
                  className="mc_option_selected"
                  type="button"
                  key={option}
                  value={option}
                >
                  {option}
                </button>
              );
            } else {
              return (
                <button
                  className="mc_option"
                  type="button"
                  key={option}
                  value={option}
                  onClick={(e) => this.updateGuess(e)}
                >
                  {option}
                </button>
              );
            }
          })}
        </div>

        <button id="submit_button" type="button" onClick={this.handleSubmit}>
            Submit
        </button>
      </div>
    );
  };
  playSound = () => {
    msg.text = this.state.nextWord;
    window.speechSynthesis.speak(msg);
  }

  

  render() {
    console.log(this.context.words);
    let headerText = "Translate the word:";
    let speechErrorText = "";
    if (this.state.isCorrect && this.state.guessBool) {
      headerText = "You were correct! :D";
    }
    if (!this.state.isCorrect && this.state.guessBool) {
      headerText = "Good try, but not quite right :(";
    }
    if (this.state.speechBool) {
      speechErrorText = "Please say one of the options."
    }


    return (
      <div id="mc_container">
        {!this.state.loading && (
          <>
            <h2>{headerText}</h2>
            <span>{this.state.nextWord}{'  '}<button onClick={this.playSound}><i class="fas fa-volume-up"></i></button></span>
          </>
        )}

        {this.state.speechBool && <h3 style={{ color: 'red' }}>{speechErrorText}</h3>}

        {!this.state.guessBool ? this.MultipleChoiceForm() : ""}

        {this.state.guessBool && (
          <Results
            isCorrect={this.state.isCorrect}
            totalScore={this.state.totalScore}
            guess={this.state.guessTerm}
            answer={this.state.answer}
            original={this.state.nextWord}
            onNextWordClick={this.handleNextWord}
          />
        )}
      </div>
    );
  }
}
