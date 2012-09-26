goog.provide('yuma.modules.image.ImageAnnotator');

goog.require('goog.soy');
goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.math');
goog.require('goog.style');

/**
 * The ImageAnnotator is responsible for handling annotation functionality on
 * one image in the page.
 * @param {element} image the image DOM element
 * @constructor
 */
yuma.modules.image.ImageAnnotator = function(image) {
  /** @private **/
  this._image = image;
  
  /** @private **/
  this._eventBroker = new yuma.events.EventBroker(this);
  
  /** @private **/
  this._annotationLayer = goog.dom.createDom('div', 'yuma-annotationlayer');
  goog.style.setStyle(this._annotationLayer, 'position', 'relative');
  goog.style.setSize(this._annotationLayer, image.width, image.height);
  
  goog.dom.replaceNode(this._annotationLayer, image);
  goog.dom.appendChild(this._annotationLayer, image);
    
  var hint = goog.soy.renderAsElement(yuma.templates.image.hint, {msg:'Click and Drag to Annotate'});
  goog.style.setOpacity(hint, 0); 
  goog.dom.appendChild(this._annotationLayer, hint);
  
  var viewCanvas = goog.soy.renderAsElement(yuma.templates.image.canvas,
    {width:image.width, height:image.height});
  goog.dom.appendChild(this._annotationLayer, viewCanvas);   

  var editCanvas = goog.soy.renderAsElement(yuma.templates.image.canvas, 
    {width:image.width, height:image.height});
  goog.style.showElement(editCanvas, false); 
  goog.dom.appendChild(this._annotationLayer, editCanvas);  
 
  // TODO correctly fire
  //  yuma.events.EventType.MOUSE_OVER_ANNOTATABLE_MEDIA,
  //  yuma.events.EventType.MOUSE_OUT_OF_ANNOTATABLE_MEDIA,
  
  goog.events.listen(this._annotationLayer, goog.events.EventType.MOUSEOVER, function() { 
    goog.style.setOpacity(viewCanvas, 1.0); 
    goog.style.setOpacity(hint, 0.8); 
  });
  goog.events.listen(this._annotationLayer, goog.events.EventType.MOUSEOUT, function() { 
    goog.style.setOpacity(viewCanvas, 0.4); 
    goog.style.setOpacity(hint, 0);
  });
 
  // Instantiate worker objects
  var viewer = new yuma.modules.image.Viewer(viewCanvas, this);
  
  var selector = new yuma.selection.DragSelector(editCanvas, this);
  goog.events.listen(this._annotationLayer, goog.events.EventType.MOUSEDOWN, function(event) { 
    goog.style.showElement(editCanvas, true);
    selector.startSelection(event.offsetX, event.offsetY);
  });

  // Set up lifecycle event handling
  var self = this;
  this._eventBroker.addHandler(yuma.events.EventType.SELECTION_COMPLETED, function(event) {
    var shape = event.shape;
    var editor = new yuma.editor.Editor(selector, self,
                                        shape.geometry.x + self._image.offsetLeft,
                                        shape.geometry.y + shape.geometry.height + 4 + self._image.offsetTop);
  });

  this._eventBroker.addHandler(yuma.events.EventType.MOUSE_OVER_ANNOTATION, function(event) {
    console.log('mouseover');
  });

  this._eventBroker.addHandler(yuma.events.EventType.MOUSE_OUT_OF_ANNOTATION, function(event) {
    console.log('mouseoutof');
  });
  
  this._eventBroker.addHandler(yuma.events.EventType.ANNOTATION_EDIT_CANCEL, function(event) {
    goog.style.showElement(editCanvas, false);
    selector.stopSelection();  
  });

  this._eventBroker.addHandler(yuma.events.EventType.ANNOTATION_EDIT_SAVE, function(event) {
    goog.style.showElement(editCanvas, false);
    viewer.addAnnotation(event.annotation);
    selector.stopSelection();  
  });
}

yuma.modules.image.ImageAnnotator.prototype.getImage = function() {
  return this._image;
}

yuma.modules.image.ImageAnnotator.prototype.appendChild = function(element) {
  goog.dom.appendChild(this._annotationLayer, element);
}

yuma.modules.image.ImageAnnotator.prototype.addHandler = function(type, handler) {
  this._eventBroker.addHandler(type, handler);  
}

yuma.modules.image.ImageAnnotator.prototype.fireEvent = function(type, event) {
  this._eventBroker.fireEvent(type, event);
}