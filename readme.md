# Sentimentai

## Summary

A small hobby project for practicing NLP sentiment analysis, and more so ML deployment. The intention is to create a simple text sentiment analyzer, slightly akin to tools such as Grammarly. The project will include:
* Command-line script for (re-)training supervised models based on grid search defined in the script itself (scikit-learn)
* Small full-stack webpage for demonstrating inference from the model (FastAPI, React)
* Deployment pipeline, for example to Heroku

The intention of this project is to practice the "practical" side of ML applications, and hence there is a lot of room for improvement, for example, in the model selection process, which is heavily automated, and not fully optimized. The automated process also leaves a lot of search space e.g. for different hyperparameters undiscovered, since I aimed for relatively quick training on my own PC.

![Screenshot of the application](/app.png?raw=true "Screenshot of the application")

## Custom NLP classifier

The NLP classifier is built using sklearn for the purpose of employing grid search over different models, by allowing the classifier itself to utilize different classifiers and feature extractors. The custom class is located in `nlpclassifier` and needs to be built by running `pip install .` in the corresponding folder. The custom model class is a requirement for both the backend, and model trainer utility.

## Command-line script

The command line script for model deployment is located in the `modeltrainer` folder. The script takes in text files in the following format for training

    negative text\t0\n
    positive text\t1\n
    ...
    
Where 0 denotes a negative, and 1 denotes a positive text.

The script then picks a best model out of multiple options, based on balanced accuracy score. Once the best model is selected, it is dumped into file `sentiment_classifier.joblib.pkl`.

The command line script expects the following syntax:

    python model_trainer.py
    -f  List of text files to use in training, relative to working or specified directory
    -l  A lexicon to use in training, relative to working or specified directory
    -d  Directory to search for text files, relative to working directory. Defaults to ./data
    -s  Size of training test, as fraction of total dataset    

## Modelling approach

The modelling approach here was relatively simple. I used my custom sklearn classifier with integrated text tokenization which (using NLTK):
- Normalizes text to lowercase
- Tokenizes text
- Tags positions in text with treebank, converts these into the format used by WordNet
- Lemmatizes the text using wordnet
- Adds negation labels to words
- Removes stopwords and punctuation

In addition to text tokenizations, I extracted lexicon-based monogram sentiment scores as features, using AFINN lexicon. Using the aforementioned negation labels, I flipped sentiment values for these negated words. So e.g. if word "good" has a sentiment value of +3 (positive), the negation labeled word "good_NEG" yields a value of -3 (negative).

On top of the lexicon-derived features, I tried two different for feeding the tokenized text into classifiers, employing grid search:
- Bag of words, 1 to 3 n-grams
- TF-IDF, 1 to 3 n-grams

In addition to feature extractors, I employed grid search over multiple classifiers (to feed into my custom sklearn wrapper), and chose the classifier with the best balanced accuracy (since I hadn't done a stratified train-test-split!). To get probabilities out of models that did not support sklearn's predict_proba-method, and also to calibrate other models, I used Platt's method for cross-validated probability calibration, as an "inner" cross validation. After finding the best model with this approach, I then trained the model on the entire dataset, also including test data, again with 5-fold calibration cross-validation to avoid overfitting.

Different classifiers used were:
- Complement Naive Bayes
- Gaussian Naive Bayes
- Multinomial Naive Bayes
- Linear Support Vector Classifier
- Stochastic Gradient Descent Classifier
- (Lasso) Logistic Regression

So far, due to randomness (and lack of rigorious evaluation), all of the different classifiers have been selected as the "best" ones, with the exception of Gaussian NB. Across runs, the balanced accuracy on 1800 samples' 5-fold CV and 1200 samples' test set has been quite similiar, varying between around 78.5%-85.0%. Similarly as with classifiers, I haven't yet established a clear winner between BoW and TF-IDF feature extractors.

Note, however, that the intention of this project is not to dive deep into optimizing the models and hyperparameter tuning - with careful adjustments, it could probably be possible to increase the test accuracy by a percentage point or two, and also do a more rigorious survey about the fitness of different methods.

## Backend

The backend for the project is a minimalistic FastAPI server that responds to text requests with inferences (positive/negative). Following limitations are in place:
- Requests can only contain upwards to 400 characters
- A single IP address can only make up to 100 requests per day

Backend can be run from `backend`-folder with `uvicorn main:app`.

Since the backend is built on FastAPI, the backend also comes with Swagger documentation in path `/docs` in the api.

## Frontend

Minimal (TypeScript) React single page app, that allows for inputting text, and getting automatic inference for the text. The inference shows the sentiment and probability of the classification.

Frontend can be run from `frontend`-folder with `npm start`.

NOTE: The frontend is not responsive and won't look good on mobile devices.

## Model data

I constructed the model on sentiment data (`modeltrainer/data`) derived from https://www.kaggle.com/datasets/marklvl/sentiment-labelled-sentences-data-set

The original dataset is attributed to _'From Group to Individual Labels using Deep Features', Kotzias et. al,. KDD 2015_

The data consists of 500 positive-labeled (1) and 500 negative-lableled (0) reviews from Amazon, IMDB and Yelp each. The reviews and labels are tab-delimited, with observations delimited by linebreaks.

Obviously, the dataset is focused on reviews and might hence not be fully generalizable to communication in other contexts. Furthermore, the datasets are quite small. To better assess (and train) the generality of these models, data from different type of sources (e.g. literature, instant messaging) should be obtained. Additionally, it could be helpful to establish feedback loops to get more accurate predictions, for example with the following scheme
1. Users send their text for prediction, and receive a sentiment classification
2. The user can flag the classification as correct / incorrect, which is sent back to the system
3. The server does some filtering, e.g. to avoid spam/malicious flags. The filtering could also be done by human moderators.
4. After filtering, the data is added to a "backlog"
5. Depending on the ML method being used, the "backlog" is used to either partially retrain the model each day, or the full model is retrained at specific time intervals with new entries added to the entire training set from the feedback loop

In addition to the labeled text data, I used the AFINN-111 Lexicon available from http://www2.imm.dtu.dk/pubdb/pubs/6010-full.html, which was originally used in _'Lars Kai Hansen, Adam Arvidsson, Finn Årup Nielsen, Elanor Colleoni,
Michael Etter, "Good Friends, Bad News - Affect and Virality in
Twitter", The 2011 International Workshop on Social Computing,
Network, and Services (SocialComNet 2011)._
