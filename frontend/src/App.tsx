import React, { useEffect } from 'react';
import { useState } from 'react';
import './App.css';
import axios from "axios";

function App() {
  const [sentiment, setSentiment] = useState("❔")
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(0);
  const [textLength, setTextLength] = useState(0);

  useEffect(() => {
    window.setTimeout(() => {
      if (loading) {
        setLoadingPeriods(loadingPeriods + 1);
      }
    }, 500);
  }, [loading, loadingPeriods]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>): void => {
    if (timer) {
      clearTimeout(timer)
    }

    // Delay API query to make sure the user stopped typing
    const text = e.currentTarget.value;
    const t = window.setTimeout(() => {
      e.preventDefault();

      if (text.length > 0 && text.length < 401) {
        axios.post("http://localhost:8000/classify/", { text })
          .then(res => {
            setLoading(false);
            const positive = res.data.positive;
            if (positive) {
              setSentiment("🙂");
            } else {
              setSentiment("☹️");
            }
          })
          .catch(error => {
            setLoading(false);
            alert(error.message)
          })
      } else {
        setSentiment("❔");
      }
    }, 2000);

    setTimer(t);

    setTextLength(text.length);

    // Simple visual effect for loading    
    if (text.length === 0 || text.length > 400) {
      setLoading(false);
    } else if (!loading) {
      setLoading(true);
    }
  }

  return (
    <div className="App">
      <header>
        <img src={require("./logo-full.png")} className="header-logo" alt="logo" />
      </header>
      <main>
        <div id="text-input-col">
          <b>How does your text sound?</b>
          <textarea placeholder="Start typing..." onChange={handleInput} />
          <p className={textLength > 400 ? "text-warning" : "text-normal"}>{textLength} / 400 characters</p>
        </div>
        <div id="results">
          <div id="sentiment">
            <b>Sentiment</b> &emsp;
            {loading && ".".repeat(loadingPeriods % 3 + 1)}
            {loading && <br/>}
            {!loading && sentiment}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
