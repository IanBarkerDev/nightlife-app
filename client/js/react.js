var arr = ["Ian", "Pilar", "Anna"];
var CommentBox = React.createClass({
    getInitialState: function() {
        return {
            number: 1
        }
    },
    
    render: function() {
        return (
            <div>
                <p>Comment {this.state.number}</p>
                <Comment author={arr[this.state.number]}/>
            </div>
            )
    }
});
      
var Comment = React.createClass({
    render: function() {
        return (
            <p>Comment by {this.props.author}</p>
            )
    }
});
      
ReactDOM.render(<CommentBox />, document.getElementsByClassName("profile-results")[0]);
         