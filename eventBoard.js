posts = new Meteor.Collection('posts')

if(Meteor.isClient){

  Meteor.subscribe('myposts');
  Meteor.subscribe('users');

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_EMAIL'
  });


  Template.showPosts.helpers({
    'posts' : function(){
      return posts.find();
    },
    'selectedPost' : function(){
      if(Session.get('selectedPost') == this._id){
        return 'selectedPost';
      }
    },
    'theAuthor' : function(){
      if(Meteor.user().username == this.author){
        return true;
      }
    },
    'hasRSVP': function(){
      if(Meteor.user().rsvpedEvents.indexOf(this._id) != -1){
        return true;
      }
    }
  });

  Template.showPosts.events({
    'click .post': function(event){
      var postId = this._id;
      Session.set('selectedPost', postId);
      var selectedPost = Session.get('selectedPost');
      if(Session.get('clickedEdit') != postId){
       Session.set('clickedEdit', false); //Reset the clickd edit
      }
      //console.log(selectedPost);
    },
    'click .removePost': function(event){
      posts.remove(this._id);
    },
    'click .rsvp': function(event){
      Meteor.call('modifyRSVP', this._id,Meteor.userId(),1);
    },
    'click .cancelrsvp': function(event){
      Meteor.call('modifyRSVP', this._id,Meteor.userId(),0);
    },
    'click .editPost': function(){
      Session.set('clickedEdit', this._id);
    }
  });

  Template.newEventForm.events({
    'submit form.newEvent': function(event){
      event.preventDefault();
      var title = event.target.newtitle.value;
      var imgURL = event.target.newimgURL.value;
      var descp = event.target.newdescription.value;
      var time = event.target.newtime.value;
      var location = event.target.newlocation.value;
      Meteor.call('insertNewEvent', title, descp, imgURL, time, location);
    }
  });

  Template.editPost.helpers({
    'editthisPost' : function(){
      if(Session.get('clickedEdit') == this._id){
        return 'show';
      }
    }
  });

  Template.editPost.events({
    'submit form.editEvent': function(event){
      event.preventDefault();
      //console.log(this._id);
      var postId = this._id;
      var title = event.target.edittitle.value;
      var descp = event.target.editdescription.value;
      var imgURL = event.target.editimgURL.value;
      var time = event.target.edittime.value;
      var location = event.target.editlocation.value;
      Meteor.call('editEvent', postId, title, descp,imgURL, time, location);
       Session.set('clickedEdit', false);
    },
    'click .cancelEdit': function(){
      Session.set('clickedEdit', false);
    }
  });
}

if(Meteor.isServer){

  Meteor.publish('myposts', function(){
    return posts.find();
  });

  Meteor.publish('users', function() {
    var currentUser = this.userId;
    return Meteor.users.find({_id:currentUser}, {fields:{rsvpedEvents:1}});
  });

  Meteor.methods({
    'insertNewEvent': function(title, descp, imgURL, time, location){
      posts.insert({
        title: title,
        author: Meteor.user().username,
        description: descp,
        time: time,
        location: location,
        imgURL: imgURL,
        rsvp: 0,
        userlist: []
      });
    },
    'modifyRSVP' : function(id,user,incOrDec){
      if(incOrDec == 1){
          posts.update(
          {
            _id: id
          },
          {
            $addToSet:{
              userlist: user
            }
          }
        );
        Meteor.users.update({_id: user},
        {
          $addToSet:{
            rsvpedEvents : id
          }
        });
          //console.log(Meteor.users.findOne(user));
      }
      else{
        posts.update(
          {
            _id: id
          },
          {
            $pull:{
              userlist: user
            }
          }
        );
        Meteor.users.update({_id: user},
        {
          $pull:{
            rsvpedEvents : id
          }
        });

        //console.log(Meteor.users.findOne(user));
      }
      
    },
    'editEvent' : function(postId, title, descp, imgURL, time, location){
      posts.update(
        {_id: postId},
        {$set: 
          {
            title: title,
            description: descp,
            imgURL: imgURL,
            time: time,
            location: location
          }
        }
      );
    }
  });
}