<p align="center">
  <img src="overview.gif" alt="AI Overview" width="600">
</p>


# Overview

A web-based chat application that leverages Large Language Models (LLMs) to provide an intelligent, conversational interface for interacting with maps. Users can ask for directions, search for places, and have a natural conversation with an AI assistant that understands geographical queries.

The application supports both cloud-based LLMs (Google's Gemini) and locally-run models via Ollama, providing flexibility and privacy.

## Features

- **Conversational Interface:** Chat with an AI to get directions and find places.
- **Dual LLM Support:** Switch between a powerful cloud-based model (Gemini) and a local, private model (Ollama).
- **Dynamic Map Integration:** Displays routes and search results on an embedded Google Map.
- **Responsive Design:** A clean, modern interface that works on different screen sizes.

### Frontend

- **Framework:** [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Map:** [Google Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)

### Backend

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **LLM Integration:**
  - [google-generativeai](https://pypi.org/project/google-generativeai/) for Gemini
  - HTTP requests to a local [Ollama](https://ollama.com/) server

## Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Python](https://www.python.org/) (v3.9 or later)
- An active Google Maps API key. See [Google's documentation](https://developers.google.com/maps/documentation/javascript/get-api-key) for instructions.
- (Optional) An active Google AI API key for Gemini. See the [Google AI documentation](https://ai.google.dev/).
- (Optional) [Ollama](https://ollama.com/) installed and running for local LLM support. You must have pulled a model, e.g., `ollama pull gemma3:1b`.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd geochat-ai
    ```

2.  **Setup Environment Variables:**
    Create a `.env` file in the root of the project by copying the example:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in the required values as described in the "Environment Variables" section below.

3.  **Install Frontend Dependencies:**
    ```bash
    npm install
    ```

4.  **Install Backend Dependencies:**
    ```bash
    cd server
    pip install -r server/requirements.txt
    ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd server
    uvicorn main:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

2.  **Start the Frontend Development Server:**
    In a new terminal, run:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## Environment Variables

To run the application, you need to configure the following environment variables in a `.env` file in the project root.

-   `GOOGLE_MAPS_API_KEY`: **(Required)** Your Google Maps API key. This is used for the map embed functionality.
-   `GEMINI_API_KEY`: **(Required for Gemini)** Your Google AI API key to use the Gemini model.
-   `GEMINI_MODEL`: The specific Gemini model to use (e.g., `gemini-1.5-flash`). Defaults to `gemini-1.5-flash`.
-   `OLLAMA_SERVER_URL`: The URL of your local Ollama server. Defaults to `http://localhost:11434`.
-   `OLLAMA_MODEL`: The name of the local model you want to use with Ollama (e.g., `gemma:2b`). Make sure you have pulled this model.
