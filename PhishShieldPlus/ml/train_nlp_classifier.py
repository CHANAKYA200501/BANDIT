import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

def train_dummy_nlp_model():
    print("Training NLP Text Classifier...")
    
    # Dummy data
    texts = [
        "Your bank account is blocked, click here to verify.",
        "Meeting at 10 AM regarding the project.",
        "Congratulations! You won the lottery. Provide your bank details.",
        "Please review the attached invoice for last month's AWS usage."
    ]
    labels = [1, 0, 1, 0] # 1 = Phishing/Scam, 0 = Safe
    
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer()),
        ('clf', LogisticRegression())
    ])
    
    pipeline.fit(texts, labels)
    
    with open("nlp_classifier.pkl", "wb") as f:
        pickle.dump(pipeline, f)
    print("Model saved to nlp_classifier.pkl")

if __name__ == "__main__":
    train_dummy_nlp_model()
