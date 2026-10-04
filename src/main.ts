/** The hall's entry point. Step 1 of the slice plan: the name on the door. */
import './styles.css';

const root = document.getElementById('root');
if (root) {
  const title = document.createElement('h1');
  title.className = 'marquee';
  title.textContent = 'JollyBlue';
  root.append(title);
}
