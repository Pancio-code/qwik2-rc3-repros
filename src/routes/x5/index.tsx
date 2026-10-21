// #9258 "customer-profile" (deferred): an object chosen in the shell keeps its identity in a late segment.
import { component$, isServer, Pending, useSignal, type Signal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
type Profile = { name: string };
type P = { customer: Signal<{ profile: Profile }>; selected: Signal<Set<Profile>>; message: Signal<string> };
const Actions = component$((props: P) => {
  const profile = props.customer.value.profile;
  return (
    <button id="confirm" onClick$={() => {
      const s = props.selected.value;
      props.message.value = s.has(profile) ? `confirmed (${s.size})` : `lost (${s.size})`;
    }}>Confirm {profile.name}</button>
  );
});
const Deferred = component$((props: P) =>
  isServer ? (wait(300).then(() => <Actions {...props} />) as any) : <Actions {...props} />,
);
export default component$(() => {
  const customer = useSignal({ profile: { name: "Anna" } });
  const selected = useSignal(new Set<Profile>());
  const message = useSignal("");
  return (
    <section>
      <button id="select" onClick$={() => {
        selected.value = new Set([...selected.value, customer.value.profile]);
        message.value = "selected";
      }}>Select</button>
      <output id="msg">{message.value}</output>
      <Pending fallback$={() => <p>Loading</p>}>
        <Deferred customer={customer} selected={selected} message={message} />
      </Pending>
    </section>
  );
});
