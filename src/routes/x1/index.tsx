// #9259 unit-test shape: computed created in the shell, first read inside a late segment (raw promise child).
import { component$, isServer, Pending, useComputed$, useSignal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Late = component$((props: { double: { value: number } }) => <p id="late">slow {props.double.value}</p>);
const Slow = component$((props: { double: { value: number } }) => (
  <>{isServer ? wait(300).then(() => <Late double={props.double} />) : <Late double={props.double} />}</>
));
export default component$(() => {
  const count = useSignal(1);
  const double = useComputed$(() => count.value * 2);
  return (
    <main>
      <button id="inc" onClick$={() => count.value++}>{count.value}</button>
      <Pending fallback$={() => <p>Waiting slow</p>}>
        <Slow double={double} />
      </Pending>
    </main>
  );
});
