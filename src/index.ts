import {isProxy, reactive} from "./reactive/reactive";
import { effect } from "./effect/effect";
import { toRow } from "./reactive/toRow";
import {ref} from "./reactive/ref";
import {computed} from "./component/computed";
import {watch} from "./component/watch";

export default {
    ref,
    toRow,
    effect,
    reactive,
    computed,
    watch,
    isProxy,
}
