import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// Import the icons you want
import {
  faPlus,
  faTrash,
  faPen,
  faCircleNotch,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

library.add(
  faPlus,
  faTrash,
  faPen,
  faGithub,
  faTrash,
  faCircleNotch,
  faArrowRight
);

export default FontAwesomeIcon;
