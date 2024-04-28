from flask import Flask, request, render_template, session
import pandas as pd

# Flask API admin
app = Flask(__name__)
app.secret_key = 'secret_key'

#Datatset load in
try:
    global_data = pd.read_excel('pod-data.xlsx', engine='openpyxl')
except Exception as e:
    print("Failed to load data:", e)
    global_data = pd.DataFrame()  # Use an empty DataFrame as a fallback

#helper function to return dataset subject to filters as html table
def get_table():
    data = global_data
    for column, values in session['filter_dict'].items():
        if values:
            #Numerical column values are returned as strings from the form - this converts them to back to integers
            if data[column].dtype in ('int64', 'int32'):
                values = [int(value) for value in values]
            data = data[data[column].isin(values)] #returns all entries with the value in column being one of the filter values
    return data.to_html(index=False)

@app.route('/')
def load():
    session['filter_dict'] = {column: [] for column in global_data.columns}# Reset the filters on reload
    unique_entries = {column: global_data[column].unique() for column in global_data.columns[:-2]}
    return render_template('layout.html', table_data = get_table(), unique_entries = unique_entries)    

@app.route('/add_filter', methods=['POST'])
def add_filter():
    column = request.form.get('column')
    value = request.form.get('value')
    session['filter_dict'][column].append(value)
    session.modified = True
    return get_table()

@app.route('/remove_filter', methods=['POST'])
def remove_filter():
    column = request.form.get('column')
    value = request.form.get('value')
    session['filter_dict'][column].remove(value)
    session.modified = True
    return get_table()

if __name__ == '__main__':
    app.run(debug=True)