import { getFirestore, collection, query, where } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import styles from '../styles/components/SelectSnippet.module.css';

export default function SelectSnippet(props) {
  const { currUser, currSnippet, loadSnippet } = props;

  const db = getFirestore();

  const snippetsRef = collection(db, 'snippets');
  const snippetsQuery = query(snippetsRef, where('uid', '==', currUser.id));
  const [snippets] = useCollectionData(snippetsQuery, { idField: 'id' });

  // return if loading snippets
  if (!snippets) return <p>Loading...</p>;
  if (!snippets.length) return (
    <>
      <p>No snippets yet</p>
    </>
  );

  return (
    <select
      value={currSnippet}
      onChange={e => {
        const id = e.target.value;
        if (!id) loadSnippet(null);
        else {
          const snippet = snippets.find(snippet => snippet.id === id);
          loadSnippet(snippet);
        }
      }}
    >
      <option value=""></option>
      {
        snippets &&
        snippets.map(snippet =>
          <option key={snippet.id} value={snippet.id}>
            {snippet.title}
          </option>
        )
      }
    </select>
  );
}
