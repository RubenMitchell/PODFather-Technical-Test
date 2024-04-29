# PODFather-Technical-Test

This is a basic app for visualisation of small database including intutitve sorting and filtration features, as well as a more interesting distribution plot and range control mechanism. Using the application  is simple - to sort simply click headers - to filter interact with one of the filtration menus - and to restrict range drag the sliders underneath the distribution plots. 

## Installation
To run this Flask app, you'll need Python 3.8 or later. Follow these steps to set up your environment:

### Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/RubenMitchell/PODFather-Technical-Test.git
   cd PODFather-Technical-Test
2. **install required packages**
   pip install -r requirements.txt
3. **Set up a virtual environment (optional but recommended)**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
Once the setup is complete and you are in your virtual environment, start the Flask application with the following commands.
   ```bash 
   export FLASK_APP=app.py  
   export FLASK_ENV=development
   flask run
```

Then visit http://127.0.0.1:5000 in your browser to view the app.

### Problems Encountered and Next Steps

The main issues were related to asynchronous fucntions updating and pulling from the backend at differnt times leading to inconsistent and undesriable behaviours. Beyond that there was the age old CSS wrangling and a small amount of trouble trying to figure out how to create a zip folder to pass to the web app without needing to save the file (and then also how to unpack the folder in jscript...). In terms of future work I would like to implement multi column sorting; a search function; and time series plotting capabilities. Some sort of auto suggesting graphing assistant was also in the dream pipeline however I did not leave nearly enough time to get to that!


