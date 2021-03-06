import IconButton from '../components/IconButton';
import Code from '../components/Code';
import MatButton from '../components/MatButton';
import CodeLine from '../components/CodeLine';
import SelectSnippet from '../components/SelectSnippet';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';

import {
  getFirestore, doc, updateDoc, collection, addDoc, deleteDoc
} from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import highlightJs from '../util/highlightJs';
import signIn from '../util/signIn';

let editorDirty = false;

import styles from '../styles/components/SandboxEngine.module.css';

export default function SandboxEngine(props) {
  const { currUser, setupUser } = props;

  const db = getFirestore();

  const [docsHidden, setDocsHidden] = useState(false);

  const [code, setCode] = useState(props.code ?? '');

  const [title, setTitle] = useState(props.title ?? '');
  const [saving, setSaving] = useState(false);

  const [currSnippet, setCurrSnippet] = useState(null);

  const didMountRef = useRef(false);

  // called before page unloads
  function beforeUnload(e) {
    // return if editor not dirty
    if (!editorDirty) return;
    // cancel unload
    e.preventDefault();
    e.returnValue = '';
  }

  // on start
  useEffect(() => {
    // initialize unload event listener
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, []);

  useEffect(() => {
    if (didMountRef.current) editorDirty = true;
    else didMountRef.current = true;
  }, [code]);

  // highlight js on start
  useEffect(() => {
    highlightJs();
  }, []);

  // sets output to given string
  function setOutput(str, color) {
    document.getElementById('output').innerHTML =
      color ?
      `<span style="color: ${color}">${str}</span>`
      : str;
  }

  // adds given string to output
  function addOutput(str, color) {
    document.getElementById('output').innerHTML +=
      color ?
      `<span style="color: ${color}">${str}</span>`
      : str;
  }

  // compiles user code
  async function compile() {
    if (currSnippet) saveSnippet(); // autosave
    // reset console
    setOutput('...');
    // eslint-disable-next-line no-undef
    await new Promise(res => setTimeout(res, 0));
    setOutput('');
    function log(str) {
      addOutput(`${str}\n`);
    }
    // eslint-disable-next-line no-unused-vars
    function alert(str) {
      window.alert(str);
      log(`> ${str}`);
    }
    // eslint-disable-next-line no-unused-vars
    function prompt(str) {
      const val = window.prompt(str);
      log(`> ${str} > ${val}`);
      return val;
    }
    // eslint-disable-next-line no-unused-vars
    function logImage(url) {
      log(`<img src=${url} alt=${url} />`);
    }
    try {
      eval(code);
      addOutput('Done', 'green');
    } catch (error) {
      // search for error position in stack
      const errorLines = error.stack.split('\n').slice(1);
      let errorPosition;
      // for each error line
      for (const errorLine of errorLines) {
        // get anonymous index and skip if none
        const anonymousIndex = errorLine.indexOf('<anonymous>:');
        if (anonymousIndex === -1) continue;
        // get error position and break
        errorPosition = errorLine.slice(anonymousIndex + 12, -1).split(':');
        break;
      }
      // get error message
      const errorMessage = error.stack.split("\n")[0];
      // if error position found
      if (errorPosition) {
        // get error row and col
        const errorRow = parseInt(errorPosition[0]);
        const errorCol = parseInt(errorPosition[1]);
        // set error text
        setOutput(`line ${errorRow} col ${errorCol}:\n${errorMessage}`, 'red');
      // if no error position found
      } else {
        // set error text
        setOutput(`${errorMessage}`, 'red');
      }
    }
  }

  // saves snippet
  function save() {
    if (currUser === false) signIn(setupUser);
    if (currUser === null) setupUser();
    else if (currUser) {
      setTitle(currSnippet?.title ?? '');
      setSaving(true);
    }
  }

  // saves snippet to firebase
  async function saveSnippet() {
    // get snippet object
    const snippet = {
      code: code,
      uid: currUser.id,
      title: title
    };
    // update snippet
    const id = currSnippet?.id;
    setSaving(false);
    if (id) {
      const snippetRef = doc(db, 'snippets', id);
      updateDoc(snippetRef, snippet);
    // create snippet
    } else {
      const snippetsRef = collection(db, 'snippets');
      const snippetDoc = await addDoc(snippetsRef, snippet);
      setCurrSnippet({ id: snippetDoc.id, ...snippet });
    }
  }

  // loads given snippet
  function loadSnippet(snippet) {
    if (currSnippet) saveSnippet(); // autosave
    // swap snippet
    setCurrSnippet(snippet);
    setCode(snippet?.code ?? '');
    setTitle(snippet?.title ?? '');
    if (snippet) {
      setOutput(`Loaded snippet ${snippet.title}`, 'green');
    } else setOutput('');
  }

  // deletes snippet in firebase
  async function deleteSnippet() {
    if (!window.confirm(`Delete snippet ${currSnippet.title}?`)) return;
    const snippetRef = doc(db, 'snippets', currSnippet.id);
    await deleteDoc(snippetRef);
    loadSnippet(null);
  }

  return (
    <div>
      <Dialog open={saving} onClose={() => setSaving(false)}>
        <DialogContent>
          <form
            className={styles.saveform}
            onSubmit={e => {
              e.preventDefault();
              saveSnippet();
            }}
          >
            Save Snippet
            <input
              className="textinput"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
            <button className="textbutton">
              Save
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <div className={styles.content}>
      <div className={
        docsHidden ? `${styles.docs} ${styles.hidden}` : styles.docs
      }>
        <div className={styles.button}>
          {
            docsHidden ?
            <MatButton
              onClick={() => setDocsHidden(false)}
              Icon={ArrowCircleRightIcon}
            /> :
            <MatButton
              onClick={() => setDocsHidden(true)}
              Icon={ArrowCircleLeftIcon}
            />
          }
        </div>
        <div className={styles.docscontent}>
          <h2>Docs</h2>
          <CodeLine>`log(text)` logs text</CodeLine>
          <CodeLine>`logImage(url)` logs images</CodeLine>
          <CodeLine>`prompt(text)` opens prompt and returns input</CodeLine>
          <CodeLine>`alert(text)` opens alert</CodeLine>
        </div>
      </div>
      <div>
        <Code
          value={code}
          onChange={val => setCode(val)}
        />
        <div className={styles.toolbar}>
          <IconButton
            onClick={compile}
            icon="play"
          />
          <IconButton
            onClick={save}
            icon="save"
          />
          {
            currUser &&
            <SelectSnippet
              currSnippet={currSnippet}
              loadSnippet={loadSnippet}
              {...props}
            />
          }
          {
            currSnippet &&
            <IconButton
              onClick={deleteSnippet}
              icon="clear"
            />
          }
        </div>
      </div>
      <div className={styles.console}>
        <div className={styles.head}>
          <span>Console</span>
          <button
            className="textbutton"
            onClick={() => setOutput('')}
          >
            Clear
          </button>
        </div>
        <div className={styles.logs}>
          <pre
            className={styles.output}
            id="output"
          >
          </pre>
        </div>
      </div>
      </div>
    </div>
  );
}
