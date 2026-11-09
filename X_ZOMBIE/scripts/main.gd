extends Node3D

const PlayerScript = preload("res://scripts/player.gd")
const ZombieScript = preload("res://scripts/zombie.gd")

var player
var health_label: Label
var count_label: Label
var message_label: Label
var joystick_touch := -1
var joystick_origin := Vector2.ZERO
var joystick_vector := Vector2.ZERO
var score := 0
var game_over := false

func _ready() -> void:
    _setup_world()
    _spawn_player()
    _spawn_zombies()
    _setup_ui()
    InputMap.add_action("attack")
    InputMap.add_action("move_left")
    InputMap.add_action("move_right")
    InputMap.add_action("move_forward")
    InputMap.add_action("move_back")
    _configure_keyboard()

func _configure_keyboard() -> void:
    var keys := {
        "move_left": KEY_A,
        "move_right": KEY_D,
        "move_forward": KEY_W,
        "move_back": KEY_S
    }
    for action in keys:
        var key_event := InputEventKey.new()
        key_event.physical_keycode = keys[action]
        InputMap.action_add_event(action, key_event)

func _setup_world() -> void:
    var world_env := WorldEnvironment.new()
    var environment := Environment.new()
    environment.background_mode = Environment.BG_COLOR
    environment.background_color = Color(0.055, 0.07, 0.075)
    environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    environment.ambient_light_color = Color(0.62, 0.68, 0.7)
    environment.ambient_light_energy = 0.7
    world_env.environment = environment
    add_child(world_env)

    var sun := DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-52, -28, 0)
    sun.light_energy = 1.25
    add_child(sun)

    var ground := MeshInstance3D.new()
    var plane := PlaneMesh.new()
    plane.size = Vector2(42, 42)
    ground.mesh = plane
    var ground_mat := StandardMaterial3D.new()
    ground_mat.albedo_color = Color(0.18, 0.21, 0.18)
    ground_mat.roughness = 1.0
    ground.material_override = ground_mat
    add_child(ground)

    var ground_body := StaticBody3D.new()
    var ground_shape := CollisionShape3D.new()
    var box := BoxShape3D.new()
    box.size = Vector3(42, 0.2, 42)
    ground_shape.shape = box
    ground_shape.position.y = -0.1
    ground_body.add_child(ground_shape)
    add_child(ground_body)

    for i in range(16):
        var obstacle := MeshInstance3D.new()
        var block := BoxMesh.new()
        block.size = Vector3(randf_range(1.0, 2.5), randf_range(0.8, 2.0), randf_range(1.0, 2.5))
        obstacle.mesh = block
        obstacle.position = Vector3(randf_range(-17, 17), block.size.y * 0.5, randf_range(-17, 17))
        var mat := StandardMaterial3D.new()
        mat.albedo_color = Color(0.22, 0.23, 0.21)
        obstacle.material_override = mat
        add_child(obstacle)

func _spawn_player() -> void:
    player = CharacterBody3D.new()
    player.set_script(PlayerScript)
    player.position = Vector3.ZERO
    add_child(player)
    var camera := Camera3D.new()
    camera.position = Vector3(0, 12, 13)
    camera.rotation_degrees = Vector3(-43, 0, 0)
    camera.current = true
    player.add_child(camera)
    player.health_changed.connect(_on_health_changed)

func _spawn_zombies() -> void:
    for i in range(7):
        var enemy = CharacterBody3D.new()
        enemy.set_script(ZombieScript)
        var angle := TAU * float(i) / 7.0
        enemy.position = Vector3(cos(angle) * 10.0, 0.0, sin(angle) * 10.0)
        add_child(enemy)
        enemy.target = player
        enemy.defeated.connect(_on_zombie_defeated)

func _setup_ui() -> void:
    var layer := CanvasLayer.new()
    add_child(layer)
    var panel := PanelContainer.new()
    panel.position = Vector2(18, 18)
    panel.custom_minimum_size = Vector2(250, 76)
    layer.add_child(panel)
    var column := VBoxContainer.new()
    panel.add_child(column)
    health_label = Label.new()
    health_label.text = "HEALTH: 100"
    health_label.add_theme_font_size_override("font_size", 22)
    column.add_child(health_label)
    count_label = Label.new()
    count_label.text = "ZOMBIES LEFT: 7"
    count_label.add_theme_font_size_override("font_size", 18)
    column.add_child(count_label)

    var hint := Label.new()
    hint.text = "Move: left side / WASD     Attack: right side / SPACE"
    hint.position = Vector2(18, 104)
    hint.add_theme_font_size_override("font_size", 15)
    layer.add_child(hint)

    message_label = Label.new()
    message_label.text = "SURVIVE THE OUTBREAK"
    message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    message_label.anchor_left = 0.5
    message_label.anchor_right = 0.5
    message_label.offset_left = -190
    message_label.offset_right = 190
    message_label.offset_top = 18
    message_label.add_theme_font_size_override("font_size", 24)
    layer.add_child(message_label)

func _input(event: InputEvent) -> void:
    if game_over:
        return
    if event is InputEventScreenTouch:
        if event.pressed:
            if event.position.x < get_viewport().get_visible_rect().size.x * 0.5 and joystick_touch == -1:
                joystick_touch = event.index
                joystick_origin = event.position
                joystick_vector = Vector2.ZERO
            elif event.position.x >= get_viewport().get_visible_rect().size.x * 0.5:
                player.attack_requested = true
        elif event.index == joystick_touch:
            joystick_touch = -1
            joystick_vector = Vector2.ZERO
            player.move_input = Vector2.ZERO
    elif event is InputEventScreenDrag and event.index == joystick_touch:
        var delta := event.position - joystick_origin
        joystick_vector = (delta / 70.0).limit_length(1.0)
        player.move_input = joystick_vector
    elif event is InputEventKey and event.pressed and event.keycode == KEY_SPACE:
        player.attack_requested = true

func _on_health_changed(value: int) -> void:
    health_label.text = "HEALTH: %d" % value
    if value <= 0:
        game_over = true
        message_label.text = "YOU WERE OVERRUN - RESTART TO TRY AGAIN"

func _on_zombie_defeated() -> void:
    score += 1
    count_label.text = "ZOMBIES LEFT: %d" % (7 - score)
    if score >= 7:
        game_over = true
        message_label.text = "AREA CLEARED! YOU SURVIVED"
