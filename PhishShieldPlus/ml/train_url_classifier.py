# Mock URL Classifier Setup
import pickle
from sklearn.linear_model import LogisticRegression
import numpy as np

# A complete MVP would build this out using real datasets (ISCX-URL-2016, PhishTank).
def train_dummy_model():
    print("Training URL Classifier...")
    model = LogisticRegression()
    # Dummy data: features = [len, subdomains, malicious_votes], labels = [benign, phishing]
    X = np.array([[15, 0, 0], [120, 4, 15], [30, 1, 0], [45, 2, 5]])
    y = np.array([0, 1, 0, 1])
    
    model.fit(X, y)
    
    with open("url_classifier.pkl", "wb") as f:
        pickle.dump(model, f)
    print("Model saved to url_classifier.pkl")

if __name__ == "__main__":
    train_dummy_model()
