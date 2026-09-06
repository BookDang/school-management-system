// Manual mock for the `@ant-design/icons` node_modules package (auto-applied by Jest, no
// `jest.mock()` call needed). The real package's TwoTone icons pull in `@ant-design/colors`'s
// ESM-only build, which Jest can't require() as CommonJS - swap every icon for a no-op stub
// instead of fighting that packaging issue, since icon rendering isn't behavior worth testing.
const MailOutlined = () => null;
const LockOutlined = () => null;
// Renders a real element (unlike the others) since tests hover/focus it to trigger the password
// hint tooltip.
const InfoCircleOutlined = (props: Record<string, unknown>) => <span {...props} />;

export { InfoCircleOutlined, LockOutlined, MailOutlined };
