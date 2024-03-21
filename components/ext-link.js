function ExtLink(props) {
  return <a {...props} rel="noopener" target={props.target || '_blank'} />;
}
export default ExtLink;
