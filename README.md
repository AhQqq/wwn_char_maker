# Character Builder for Worlds Without Number

A web-based character builder for the *Worlds Without Number* tabletop roleplaying game.
This tool guides players through the official character creation process and exports a structured character sheet.

The system is rules-heavy and uses strict validation to ensure characters follow the rulebook.

## Current Features

- Nothing

---

## Tech Stack

Frontend
- React
- Vite
- TypeScript

Backend
- Node

---

## Project Structure 

frontend/
  public/
    data/   Game data (focus, skills, attribes, etc)
  rules/    Character creation logic
  utils/    Helper functions

backend/    All the backend logic, for storing data
---

## Running Locally

Frontend & Backend
    npm run dev
    
Install dependencies

## Design Philosophy

- Character creation rules live in backend 
- All data used in the character building lives in the frontend
- UI never contains rule logic
- Game content lives in JSON files
- All validation must be testable
