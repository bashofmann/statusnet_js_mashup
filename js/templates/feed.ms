<form action="#Post" method="post">
    <textarea name="post"></textarea>
    <input type="submit" value="abschicken"/>
</form>

<ul>
{{#feed}}
  <li>
      <p>{{{statusnet_html}}}</p>
      <p>{{created_at}} 
          {{#user}}
          {{name}}
          {{/user}}
      </p>
  </li>
{{/feed}}
</ul>

<a href="#Widget">Widget</a>