from flask import Flask, request, render_template, session, send_file, jsonify
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import io
import zipfile

# Flask API admin
app = Flask(__name__)
app.secret_key = 'secret_key'

#Datatset load in
try:
    global_data = pd.read_excel('pod-data.xlsx', engine='openpyxl')
except Exception as e:
    print("Failed to load data:", e)
    global_data = pd.DataFrame()  # Use an empty DataFrame as a fallback


def apply_normal_filters():
    data = global_data.copy()
    for column, values in list(session['filter_dict'].items()):
        if values:
            #Numerical column values are returned as strings from the form - this converts them to back to integers
            if data[column].dtype in ('int64', 'int32'):
                values = [int(value) for value in values]
            data = data[data[column].isin(values)] #returns all entries with the value in column being one of the filter values
    return data

def apply_range_filters(data):
    for column, values in list(session['range_dict'].items()):
        if values:
            data = data[(data[column] >= values[0]) & (data[column] <= values[1])]
    return data

@app.route('/')
def load():
    session['filter_dict'] = {column: [] for column in global_data.columns[:-2]}# Reset the filters on reload
    session['range_dict'] = {column: [] for column in global_data.columns[-2:]}
    session['limits'] = {column: (int(global_data[column].min()), int(global_data[column].max())) for column in global_data.columns[-2:]}
    unique_entries = {column: global_data[column].unique() for column in global_data.columns[:-2]}
    return render_template('layout.html', table_data = apply_normal_filters().to_html(index = False), unique_entries = unique_entries,  limits=session['limits'])    

@app.route('/add_filter', methods=['POST'])
def add_filter():
    column = request.form.get('column')
    value = request.form.get('value')
    session['filter_dict'][column].append(value)
    session.modified = True
    return apply_normal_filters().to_html(index = False)

@app.route('/remove_filter', methods=['POST'])
def remove_filter():
    column = request.form.get('column')
    value = request.form.get('value')
    session['filter_dict'][column].remove(value)
    session.modified = True
    return apply_normal_filters().to_html(index = False)

@app.route('/clear_filter', methods=['POST'])
def clear_filter():
    column = request.form.get('column')
    session['filter_dict'][column] = []
    session.modified = True
    return apply_normal_filters().to_html(index = False)

@app.route('/update_dists', methods=['POST'])
def update_dists():
    columns = [apply_normal_filters()["Estimated quantity (kg)"], apply_normal_filters()["Actual quantity (kg)"]]
    memory_file = io.BytesIO() 
    with zipfile.ZipFile(memory_file, 'w') as zipf:
        for column in columns:
            fig, ax = plt.subplots()
            ax.hist(column, bins=column.count(), color='black', alpha=0.7)
            session['limits'][column.name] = (int(column.min()), int(column.max()))
            ax.set_xlim(column.min(), column.max())
            #ax.set_xticklabels([])  # Remove x-axis tick labels
            ax.set_yticklabels([])  # Remove y-axis tick labels
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['left'].set_visible(False)  # Consider hiding or adjusting the left spine
            ax.tick_params(axis='both', which='both', length=0)
            pngImage = io.BytesIO()
            plt.savefig(pngImage, format='png', bbox_inches='tight', pad_inches=0, transparent=True)
            pngImage.seek(0)
            plt.close(fig)
            zipf.writestr(f'{column.name}.png', pngImage.read())
    memory_file.seek(0)
    session.modified = True
    return send_file(memory_file, mimetype='application/zip')

@app.route('/get_limits')
def get_limits():
    return jsonify(session['limits'])


@app.route('/filter_range', methods=['POST'])
def filter_range():
    column = request.form.get('column')
    lower = int(request.form.get('min'))
    upper = int(request.form.get('max'))
    session['range_dict'][column] = (lower, upper)
    session.modified = True
    return apply_range_filters(apply_normal_filters()).to_html(index = False)



if __name__ == '__main__':
    app.run(debug=True)