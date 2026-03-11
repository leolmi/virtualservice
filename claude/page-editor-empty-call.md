## Empty Call

Componente che visualizza le informazioni se non esiste una call attiva per il servizio corrente;

Immagine di riferimento: `documents/images/no-call.png`;

mostra il testo dell'immagine dove la scritta 'create new call' è cliccabile con un scss del tipo:
````scss
.as-button {
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  z-index: 2;
  
  &:hover {
    color: var(--vs-accent);
    border-color: currentColor;
    background-color: transparent;
  }
}
````
il click genera una nuova call e la imposta come attiva;

