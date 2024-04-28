from flask import Flask, request, render_template
import pandas as pd

app = Flask(__name__)

#load in the dataset
try:
    global_data = pd.read_excel('pod-data.xlsx', engine='openpyxl')
except Exception as e:
    print("Failed to load data:", e)
    global_data = pd.DataFrame()  # Use an empty DataFrame as a fallback

@app.route('/')
def load():
    return render_template('layout.html', table_data = global_data.to_html(index=False))


if __name__ == '__main__':
    app.run(debug=True)